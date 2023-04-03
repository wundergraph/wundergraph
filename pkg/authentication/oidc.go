package authentication

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

type OpenIDConnectFlavor int

const (
	OpenIDConnectFlavorDefault OpenIDConnectFlavor = iota
	OpenIDConnectFlavorAuth0
)

const (
	oidcRedirectURICookieName             = "redirect_uri"
	oidcRedirectOnCompletionURICookieName = "completion_redirect_uri"
)

type OpenIDConnectCookieHandler struct {
	log    *zap.Logger
	claims ClaimsInfo
}

func NewOpenIDConnectCookieHandler(log *zap.Logger) *OpenIDConnectCookieHandler {
	return &OpenIDConnectCookieHandler{
		log: log,
	}
}

type QueryParameter struct {
	Name  string
	Value string
}

type OpenIDConnectConfig struct {
	Issuer             string
	ClientID           string
	ClientSecret       string
	QueryParameters    []QueryParameter
	ProviderID         string
	InsecureCookies    bool
	ForceRedirectHttps bool
	Cookie             *securecookie.SecureCookie
}

type ClaimsInfo struct {
	ScopesSupported []string `json:"scopes_supported"`
	ClaimsSupported []string `json:"claims_supported"`
}

// Claims decodes JWT claims. See https://www.iana.org/assignments/jwt/jwt.xhtml.
type Claims struct {
	Issuer            string                 `json:"iss"`
	Subject           string                 `json:"sub"`
	Name              string                 `json:"name"`
	GivenName         string                 `json:"given_name"`
	FamilyName        string                 `json:"family_name"`
	MiddleName        string                 `json:"middle_name"`
	NickName          string                 `json:"nickname"`
	PreferredUsername string                 `json:"preferred_username"`
	Profile           string                 `json:"profile"`
	Picture           string                 `json:"picture"`
	Website           string                 `json:"website"`
	Email             string                 `json:"email"`
	EmailVerified     bool                   `json:"email_verified"`
	Gender            string                 `json:"gender"`
	BirthDate         string                 `json:"birthdate"`
	ZoneInfo          string                 `json:"zoneinfo"`
	Locale            string                 `json:"locale"`
	Location          string                 `json:"location"`
	Raw               map[string]interface{} `json:"-"`
}

func (c *Claims) ToUser() *User {
	return &User{
		UserID:            c.Subject,
		Name:              c.Name,
		FirstName:         c.GivenName,
		LastName:          c.FamilyName,
		MiddleName:        c.MiddleName,
		NickName:          c.NickName,
		PreferredUsername: c.PreferredUsername,
		Profile:           c.Profile,
		Picture:           c.Picture,
		Website:           c.Website,
		Email:             c.Email,
		EmailVerified:     c.EmailVerified,
		Gender:            c.Gender,
		BirthDate:         c.BirthDate,
		ZoneInfo:          c.ZoneInfo,
		Locale:            c.Locale,
		Location:          c.Location,
		CustomClaims:      c.Custom(),
	}
}

// isCustomClaim true if claim represents a token claim that we're not explicitly
// handling in type Claim
func isCustomClaim(claim string) bool {
	// XXX: Keep this list in sync with Claim's fields
	switch claim {
	case "iss", "sub", "name", "given_name", "family_name", "middle_name", "nickname", "preferred_username", "profile", "picture", "website", "email", "email_verified", "gender", "birthdate", "zoneinfo", "location", "locale":
		return false
	}
	return true
}

// Custom returns a non-nil map with claims from c.Raw that we do not
// parse explicitly
func (c *Claims) Custom() map[string]interface{} {
	custom := make(map[string]interface{})
	for k, v := range c.Raw {
		if isCustomClaim(k) {
			custom[k] = v
		}
	}
	return custom
}

func (h *OpenIDConnectCookieHandler) Register(authorizeRouter, callbackRouter *mux.Router, config OpenIDConnectConfig, hooks Hooks) {

	ctx := context.Background()

	if !h.isValidIssuer(config.Issuer) {
		h.log.Error("oidc.Register failed, invalid issuer, must be valid URL",
			zap.String("providerID", config.ProviderID),
			zap.String("issuer", config.Issuer),
		)
		return
	}

	provider := h.createProvider(ctx, config)
	if provider == nil {
		return
	}

	err := provider.Claims(&h.claims)
	if err != nil {
		h.log.Error("oidc.provider.ClaimsInfo", zap.Error(err))
		return
	}

	authorizeRouter.Path(fmt.Sprintf("/%s", config.ProviderID)).Methods(http.MethodGet).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.authorize(ctx, w, r, provider, &config)
	})

	callbackRouter.Path(fmt.Sprintf("/%s", config.ProviderID)).Methods(http.MethodGet).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.authorizationCallback(ctx, w, r, provider, &config, hooks)
	})
}

func (h *OpenIDConnectCookieHandler) authorize(ctx context.Context, w http.ResponseWriter, r *http.Request, provider *oidc.Provider, config *OpenIDConnectConfig) {

	redirectOnCompletionURI := r.URL.Query().Get("redirect_uri")

	uriWithoutQuery := strings.Replace(r.RequestURI, "?"+r.URL.RawQuery, "", 1)
	redirectPath := strings.Replace(uriWithoutQuery, "authorize", "callback", 1)
	scheme := "https"
	if !config.ForceRedirectHttps && r.TLS == nil {
		scheme = "http"
	}
	redirectURI := fmt.Sprintf("%s://%s%s", scheme, r.Host, redirectPath)

	oauth2Config := oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		Endpoint:     provider.Endpoint(),
		RedirectURL:  redirectURI,
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	state, err := generateState()
	if err != nil {
		h.log.Error("OIDCCookieHandler could not generate state",
			zap.Error(err),
		)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	cookiePath := fmt.Sprintf("/auth/cookie/callback/%s", config.ProviderID)
	cookieDomain := sanitizeDomain(r.Host)

	stateCookie := &http.Cookie{
		Name:     "state",
		Value:    state,
		MaxAge:   int(time.Minute.Seconds()),
		Secure:   r.TLS != nil,
		HttpOnly: true,
		Path:     cookiePath,
		Domain:   cookieDomain,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, stateCookie)

	redirectURICookie := &http.Cookie{
		Name:     oidcRedirectURICookieName,
		Value:    redirectURI,
		MaxAge:   int(time.Minute.Seconds()),
		Secure:   r.TLS != nil,
		HttpOnly: true,
		Path:     cookiePath,
		Domain:   cookieDomain,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, redirectURICookie)

	if redirectOnCompletionURI != "" {
		redirectOnSucessURICookie := &http.Cookie{
			Name:     oidcRedirectOnCompletionURICookieName,
			Value:    redirectOnCompletionURI,
			MaxAge:   int(time.Minute.Seconds()),
			Secure:   r.TLS != nil,
			HttpOnly: true,
			Path:     cookiePath,
			Domain:   cookieDomain,
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, redirectOnSucessURICookie)
	}

	opts := make([]oauth2.AuthCodeOption, len(config.QueryParameters))
	for i, p := range config.QueryParameters {
		opts[i] = oauth2.SetAuthURLParam(p.Name, p.Value)
	}

	redirect := oauth2Config.AuthCodeURL(state, opts...)

	http.Redirect(w, r, redirect, http.StatusFound)
}

func (h *OpenIDConnectCookieHandler) authorizationCallback(ctx context.Context, w http.ResponseWriter, r *http.Request, provider *oidc.Provider, config *OpenIDConnectConfig, hooks Hooks) {
	state, err := r.Cookie("state")
	if err != nil {
		h.log.Error("OIDCCookieHandler state missing",
			zap.Error(err),
		)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if r.URL.Query().Get("state") != state.Value {
		h.log.Error("OIDCCookieHandler state mismatch",
			zap.Error(err),
		)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	redirectURI, err := r.Cookie(oidcRedirectURICookieName)
	if err != nil {
		h.log.Error("OIDCCookieHandler redirect uri missing",
			zap.Error(err),
		)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// This is optional
	var redirectOnCompletionURI string
	if redirectOnCompletionCookie, err := r.Cookie(oidcRedirectOnCompletionURICookieName); err == nil {
		redirectOnCompletionURI = redirectOnCompletionCookie.Value
	}

	oauth2Config := &oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: config.ClientSecret,
		Endpoint:     provider.Endpoint(),
		RedirectURL:  redirectURI.Value,
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}
	if err := h.exchangeToken(ctx, w, r, oauth2Config, provider, config, hooks); err != nil {
		// Error is already logged by exchangeToken
		if redirectOnCompletionURI != "" {
			if redirURL, _ := url.Parse(redirectOnCompletionURI); redirURL != nil {
				qs := redirURL.Query()
				qs.Add("error", url.QueryEscape(err.Error()))
				redirURL.RawQuery = qs.Encode()
				redirectOnCompletionURI = redirURL.String()
			}
			http.Redirect(w, r, redirectOnCompletionURI, http.StatusFound)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
		return
	}

	if redirectOnCompletionURI != "" {
		http.Redirect(w, r, redirectOnCompletionURI, http.StatusFound)
		return
	}

	scheme := "https"
	if !config.ForceRedirectHttps && r.TLS == nil {
		scheme = "http"
	}

	redirect := fmt.Sprintf("%s://%s", scheme, path.Join(r.Host, "/auth/cookie/user"))

	http.Redirect(w, r, redirect, http.StatusFound)
}

func (h *OpenIDConnectCookieHandler) exchangeToken(ctx context.Context, w http.ResponseWriter, r *http.Request, oauth2Config *oauth2.Config, provider *oidc.Provider, config *OpenIDConnectConfig, hooks Hooks) error {
	oauth2Token, err := oauth2Config.Exchange(r.Context(), r.URL.Query().Get("code"))
	if err != nil {
		h.log.Error("OIDCCookieHandler.exchange.token",
			zap.Error(err),
		)
		return err
	}

	var (
		idToken string
	)

	accessToken := oauth2Token.AccessToken
	maybeIdToken := oauth2Token.Extra("id_token")
	if maybeIdToken != nil {
		idToken = maybeIdToken.(string)
	}

	userInfo, err := provider.UserInfo(ctx, oauth2.StaticTokenSource(oauth2Token))
	if err != nil {
		h.log.Error("oidc.provider.UserInfo", zap.Error(err))
		return err
	}

	var claims Claims
	err = userInfo.Claims(&claims)
	if err != nil {
		h.log.Error("oidc.userInfo.Claims", zap.Error(err))
		return err
	}

	err = userInfo.Claims(&claims.Raw)
	if err != nil {
		h.log.Error("oidc.userInfo.Claims.Raw", zap.Error(err))
		return err
	}

	accessTokenJSON := tryParseJWT(accessToken)
	idTokenJSON := tryParseJWT(idToken)

	user := claims.ToUser()
	user.ProviderName = "oidc"
	user.ProviderID = config.ProviderID
	user.ExpiresAt = oauth2Token.Expiry
	user.AccessToken = accessTokenJSON
	user.RawAccessToken = accessToken
	user.RawIDToken = idToken
	user.IdToken = idTokenJSON

	if err := postAuthentication(ctx, w, r, hooks, user, config.Cookie, config.InsecureCookies); err != nil {
		h.log.Error("OpenIDConnectCookieHandler postAuthentication failed",
			zap.Error(err),
		)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
	return nil
}

func (h *OpenIDConnectCookieHandler) isValidIssuer(issuer string) bool {
	_, urlErr := url.ParseRequestURI(issuer)
	return urlErr == nil
}

func (h *OpenIDConnectCookieHandler) createProvider(ctx context.Context, config OpenIDConnectConfig) *oidc.Provider {
	provider, err := oidc.NewProvider(ctx, config.Issuer)
	if err != nil {
		originalErr := err
		if strings.HasSuffix(config.Issuer, "/") {
			config.Issuer = strings.TrimSuffix(config.Issuer, "/")
		} else {
			config.Issuer += "/"
		}
		provider, err = oidc.NewProvider(ctx, config.Issuer)
		if err != nil {
			h.log.Error("oidc.createProvider failed, issuer name mismatch, auth provider not configured",
				zap.Error(originalErr),
				zap.Error(err),
			)
		}
	}
	return provider
}

type openIDConnectConfiguration struct {
	Issuer                string `json:"issuer"`
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	TokenEndpoint         string `json:"token_endpoint"`
	UserinfoEndpoint      string `json:"userinfo_endpoint"`
	JwksUri               string `json:"jwks_uri"`
	EndSessionEndpoint    string `json:"end_session_endpoint"`
}

type openIDConnectConfigurationMissingFieldError string

func (e openIDConnectConfigurationMissingFieldError) Error() string {
	return fmt.Sprintf("missing field %q", string(e))
}

func (c *openIDConnectConfiguration) Validate() error {
	// See https://openid.net/specs/openid-connect-discovery-1_0.html
	//
	// Note that our implementation uses userinfo_endpoint and hence we
	// make it required, but can work without jwks_uri so we make it optional
	if c.Issuer == "" {
		return openIDConnectConfigurationMissingFieldError("issuer")
	}
	if c.AuthorizationEndpoint == "" {
		return openIDConnectConfigurationMissingFieldError("authorization_endpoint")
	}
	if c.TokenEndpoint == "" {
		// TODO: This might be optional with Implicit Flow?
		return openIDConnectConfigurationMissingFieldError("token_endpoint")
	}
	if c.UserinfoEndpoint == "" {
		return openIDConnectConfigurationMissingFieldError("userinfo_endpoint")
	}
	return nil
}

type OpenIDDisconnectResult struct {
	// Redirect indicates an URL that must be visited by the client to complete the logout
	Redirect string `json:"redirect,omitempty"`
}

func (r *OpenIDDisconnectResult) RequiresClientCooperation() bool {
	return r != nil && r.Redirect != ""
}

type OpenIDConnectProviderOptions struct {
	Flavor     OpenIDConnectFlavor
	HTTPClient *http.Client
	Logger     *zap.Logger
}

func (o *OpenIDConnectProviderOptions) flavor() OpenIDConnectFlavor {
	if o != nil {
		return o.Flavor
	}
	return OpenIDConnectFlavorDefault
}

func (o *OpenIDConnectProviderOptions) httpClient() *http.Client {
	if o != nil && o.HTTPClient != nil {
		return o.HTTPClient
	}
	return http.DefaultClient
}

func (o *OpenIDConnectProviderOptions) logger() *zap.Logger {
	if o != nil {
		return o.Logger
	}
	return nil
}

type OpenIDConnectProvider struct {
	clientID     string
	clientSecret string
	opts         *OpenIDConnectProviderOptions
	config       *openIDConnectConfiguration
}

func NewOpenIDConnectProvider(issuer string, clientID string, clientSecret string, opts *OpenIDConnectProviderOptions) (*OpenIDConnectProvider, error) {
	if issuer == "" {
		return nil, errors.New("OIDC issuer must not be empty")
	}
	if clientID == "" {
		return nil, errors.New("OIDC client ID must not be empty")
	}
	if clientSecret == "" {
		return nil, errors.New("OIDC client secret must not be empty")
	}

	_, err := url.ParseRequestURI(issuer)
	if err != nil {
		return nil, fmt.Errorf("OIDC issuer must be a valid URL: %w", err)
	}

	issuer = strings.TrimSuffix(issuer, "/")

	introspectionURL := issuer + "/.well-known/openid-configuration"
	req, err := http.NewRequest(http.MethodGet, introspectionURL, nil)
	if err != nil {
		return nil, fmt.Errorf("could not request OIDC configuration: %w", err)
	}
	resp, err := opts.httpClient().Do(req)
	if err != nil {
		return nil, fmt.Errorf("could not fetch OIDC configuration: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OIDC configuration returned an HTTP error code: %d", resp.StatusCode)
	}
	defer resp.Body.Close()

	dec := json.NewDecoder(resp.Body)
	var config openIDConnectConfiguration
	if err := dec.Decode(&config); err != nil {
		return nil, fmt.Errorf("could not decode OIDC configuration: %w", err)
	}
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("invalid OIDC configuration: %w", err)
	}

	// Auth0 doesn't provide EndSessionEndpoint, but we handle it separately
	if config.EndSessionEndpoint == "" && opts.flavor() != OpenIDConnectFlavorAuth0 {
		if logger := opts.logger(); logger != nil {
			logger.Debug("issuer doesn't support end_session_endpoint", zap.String("issuer", issuer))
		}
	}
	return &OpenIDConnectProvider{
		clientID:     clientID,
		clientSecret: clientSecret,
		config:       &config,
		opts:         opts,
	}, nil
}

func (p *OpenIDConnectProvider) Disconnect(ctx context.Context, user *User) (*OpenIDDisconnectResult, error) {
	switch p.opts.flavor() {
	case OpenIDConnectFlavorDefault:
		return p.disconnectDefault(ctx, user)
	case OpenIDConnectFlavorAuth0:
		return p.disconnectAuth0(ctx, user)
	}
	panic("unreachable - unhandled OpenIDConnectFlavor")
}

func (p *OpenIDConnectProvider) disconnectDefault(ctx context.Context, user *User) (*OpenIDDisconnectResult, error) {
	logoutURL := p.config.EndSessionEndpoint
	if logoutURL == "" {
		return nil, errors.New("no end_session_endpoint")
	}
	req, err := http.NewRequestWithContext(ctx, "GET", logoutURL, nil)
	if err != nil {
		return nil, err
	}
	q := req.URL.Query()
	q.Set("id_token_hint", user.RawIDToken)
	req.URL.RawQuery = q.Encode()
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := p.opts.httpClient().Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return nil, nil
}

func (p *OpenIDConnectProvider) disconnectAuth0(ctx context.Context, user *User) (*OpenIDDisconnectResult, error) {
	return &OpenIDDisconnectResult{
		Redirect: fmt.Sprintf("%sv2/logout?client_id=%s", p.config.Issuer, p.clientID),
	}, nil
}

type OpenIDConnectProviderSet struct {
	providers map[string]*OpenIDConnectProvider
}

func (s *OpenIDConnectProviderSet) Add(id string, p *OpenIDConnectProvider) error {
	if s.providers == nil {
		s.providers = make(map[string]*OpenIDConnectProvider)
	}

	if s.providers[id] != nil {
		return fmt.Errorf("duplicate OIDC provider ID %q", id)

	}
	s.providers[id] = p
	return nil
}

func (s *OpenIDConnectProviderSet) ByID(id string) (*OpenIDConnectProvider, error) {
	provider := s.providers[id]
	if provider == nil {
		return nil, fmt.Errorf("no authentication provider with ID %q", id)
	}
	return provider, nil
}
