package authentication

import (
	"context"
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

type Claims struct {
	Sub                string `json:"sub"`
	Name               string `json:"name"`
	GivenName          string `json:"given_name"`
	FamilyName         string `json:"family_name"`
	Picture            string `json:"picture"`
	Email              string `json:"email"`
	EmailVerified      bool   `json:"email_verified"`
	Locale             string `json:"locale"`
	HostedGSuiteDomain string `json:"hd"`
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

		if provider == nil {
			http.Error(w, "oidc provider configuration error", http.StatusMethodNotAllowed)
			return
		}

		redirectOnSuccessURL := r.URL.Query().Get("redirect_uri")

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
			return
		}

		cookiePath := fmt.Sprintf("/auth/cookie/callback/%s", config.ProviderID)
		cookieDomain := sanitizeDomain(r.Host)

		c := &http.Cookie{
			Name:     "state",
			Value:    state,
			MaxAge:   int(time.Minute.Seconds()),
			Secure:   r.TLS != nil,
			HttpOnly: true,
			Path:     cookiePath,
			Domain:   cookieDomain,
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, c)

		c2 := &http.Cookie{
			Name:     "redirect_uri",
			Value:    redirectURI,
			MaxAge:   int(time.Minute.Seconds()),
			Secure:   r.TLS != nil,
			HttpOnly: true,
			Path:     cookiePath,
			Domain:   cookieDomain,
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, c2)

		if redirectOnSuccessURL != "" {
			c3 := &http.Cookie{
				Name:     "success_redirect_uri",
				Value:    redirectOnSuccessURL,
				MaxAge:   int(time.Minute.Seconds()),
				Secure:   r.TLS != nil,
				HttpOnly: true,
				Path:     cookiePath,
				Domain:   cookieDomain,
				SameSite: http.SameSiteLaxMode,
			}
			http.SetCookie(w, c3)
		}

		opts := make([]oauth2.AuthCodeOption, len(config.QueryParameters))
		for i, p := range config.QueryParameters {
			opts[i] = oauth2.SetAuthURLParam(p.Name, p.Value)
		}

		redirect := oauth2Config.AuthCodeURL(state, opts...)

		http.Redirect(w, r, redirect, http.StatusFound)
	})

	callbackRouter.Path(fmt.Sprintf("/%s", config.ProviderID)).Methods(http.MethodGet).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if provider == nil {
			http.Error(w, "oidc provider configuration error", http.StatusMethodNotAllowed)
			return
		}

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

		redirectURI, err := r.Cookie("redirect_uri")
		if err != nil {
			h.log.Error("OIDCCookieHandler redirect uri missing",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		oauth2Config := oauth2.Config{
			ClientID:     config.ClientID,
			ClientSecret: config.ClientSecret,
			Endpoint:     provider.Endpoint(),
			RedirectURL:  redirectURI.Value,
			Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
		}

		oauth2Token, err := oauth2Config.Exchange(r.Context(), r.URL.Query().Get("code"))
		if err != nil {
			h.log.Error("OIDCCookieHandler.exchange.token",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
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
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		var claims Claims
		err = userInfo.Claims(&claims)
		if err != nil {
			h.log.Error("oidc.userInfo.Claims", zap.Error(err))
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		accessTokenJSON := tryParseJWT(accessToken)
		idTokenJSON := tryParseJWT(idToken)

		user := User{
			ProviderName:   "oidc",
			ProviderID:     config.ProviderID,
			Email:          claims.Email,
			EmailVerified:  claims.EmailVerified,
			Name:           claims.Name,
			FirstName:      claims.GivenName,
			LastName:       claims.FamilyName,
			UserID:         claims.Sub,
			AvatarURL:      claims.Picture,
			Location:       claims.Locale,
			ExpiresAt:      oauth2Token.Expiry,
			AccessToken:    accessTokenJSON,
			RawAccessToken: accessToken,
			RawIDToken:     idToken,
			IdToken:        idTokenJSON,
		}

		hooks.handlePostAuthentication(r.Context(), user)
		proceed, _, user := hooks.handleMutatingPostAuthentication(r.Context(), user)
		if proceed {
			err = user.Save(config.Cookie, w, r, r.Host, config.InsecureCookies)
			if err != nil {
				h.log.Error("OpenIDConnectCookieHandler.user.Save",
					zap.Error(err),
				)
				return
			}

		}

		scheme := "https"
		if !config.ForceRedirectHttps && r.TLS == nil {
			scheme = "http"
		}

		if redirectOnSuccess, err := r.Cookie("success_redirect_uri"); err == nil {
			http.Redirect(w, r, redirectOnSuccess.Value, http.StatusFound)
			return
		}

		redirect := fmt.Sprintf("%s://%s", scheme, path.Join(r.Host, "/auth/cookie/user"))

		http.Redirect(w, r, redirect, http.StatusFound)
	})
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
