package authentication

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gorilla/securecookie"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

// authErrorCode is a custom string type to make sure all codes
// we pass to authError are previously defined as constants
type authErrorCode string

const (
	authErrorCodeUnknown            = authErrorCode("unknown")
	authErrorCodeBadCookie          = authErrorCode("bad_cookie")
	authErrorCodeBadState           = authErrorCode("bad_state")
	authErrorCodePostAuthentication = authErrorCode("post_authentication")
	authErrorCodeExchangeFailed     = authErrorCode("exchange_failed")
	authErrorCodeRetrieveUserFailed = authErrorCode("retrieve_user_failed")
	authErrorCodeSavedFailed        = authErrorCode("save_failed")
)

const (
	// oauth2StateCookieName stores the random state used during authentication
	oauth2StateCookieName = "state"
	// oauth2RedirectURICookieName stores the redirect_uri that we receive from
	// the client and were we should redirect it after authentication completes
	oauth2RedirectURICookieName = "redirect_uri"
	// oauth2CallbackURICookieName stores the callback uri we send to the authentication
	// provider (which will receive it as redirect_uri, NOT TO BE CONFUSED WITH OUT OWN
	// redirect_Uri)
	oauth2CallbackURICookieName = "callback_uri"
)

type AuthError interface {
	error
	ErrorCode() string
}

type authError struct {
	Code authErrorCode
	Err  error
}

func (e *authError) Error() string {
	return e.Err.Error()
}

func (e *authError) Unwrap() error {
	return e.Err
}

func (e *authError) ErrorCode() string {
	return string(e.Code)
}

type OAuth2UserRetriever interface {
	User(ctx context.Context, log *zap.Logger, token *oauth2.Token) (*User, error)
}

type OAuth2AuthenticationConfig struct {
	ProviderID         string
	ClientID           string
	ClientSecret       string
	Endpoint           oauth2.Endpoint
	Scopes             []string
	AuthTimeout        time.Duration
	ForceRedirectHttps bool
	QueryParameters    []QueryParameter
	Hooks              Hooks
	Cookie             *securecookie.SecureCookie
	InsecureCookies    bool
	Log                *zap.Logger
}

func NewOAuth2AuthenticationHandler(config OAuth2AuthenticationConfig, retriever OAuth2UserRetriever) *OAuth2AuthenticationHandler {
	log := config.Log.With(zap.String("provider", config.ProviderID), zap.String("client", config.ClientID))
	config.Log = log
	return &OAuth2AuthenticationHandler{
		config:    config,
		retriever: retriever,
	}
}

type OAuth2AuthenticationHandler struct {
	config    OAuth2AuthenticationConfig
	retriever OAuth2UserRetriever
}

func (h *OAuth2AuthenticationHandler) Authorize(w http.ResponseWriter, r *http.Request) {
	redirectURI := r.URL.Query().Get("redirect_uri")

	uriWithoutQuery := strings.Replace(r.RequestURI, "?"+r.URL.RawQuery, "", 1)
	redirectPath := strings.Replace(uriWithoutQuery, AuthorizePath, CallbackPath, 1)
	scheme := "https://"
	if !h.config.ForceRedirectHttps {
		scheme = "//"
	}

	callbackURI := fmt.Sprintf("%s%s%s", scheme, r.Host, redirectPath)
	oauth2Config := oauth2.Config{
		ClientID:     h.config.ClientID,
		ClientSecret: h.config.ClientSecret,
		Endpoint:     h.config.Endpoint,
		RedirectURL:  callbackURI,
		Scopes:       h.config.Scopes,
	}

	state, err := generateState()
	if err != nil {
		h.config.Log.Error("could not generate state",
			zap.Error(err),
		)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	cookiePath := fmt.Sprintf("/auth/cookie/%s/%s", CallbackPath, h.config.ProviderID)
	cookieDomain := sanitizeDomain(r.Host)

	cookie := &http.Cookie{
		MaxAge:   int(h.config.AuthTimeout.Seconds()),
		Secure:   r.TLS != nil,
		HttpOnly: true,
		Path:     cookiePath,
		Domain:   cookieDomain,
		SameSite: http.SameSiteLaxMode,
	}

	cookie.Name = oauth2StateCookieName
	cookie.Value = state
	http.SetCookie(w, cookie)

	cookie.Name = oauth2CallbackURICookieName
	cookie.Value = callbackURI
	http.SetCookie(w, cookie)

	if redirectURI != "" {
		cookie.Name = oauth2RedirectURICookieName
		cookie.Value = redirectURI
		http.SetCookie(w, cookie)
	}

	opts := make([]oauth2.AuthCodeOption, len(h.config.QueryParameters))
	for i, p := range h.config.QueryParameters {
		opts[i] = oauth2.SetAuthURLParam(p.Name, p.Value)
	}

	redirectToProvider := oauth2Config.AuthCodeURL(state, opts...)
	http.Redirect(w, r, redirectToProvider, http.StatusFound)
}

func (h *OAuth2AuthenticationHandler) Callback(w http.ResponseWriter, r *http.Request) {
	redirectURICookie, err := r.Cookie(oauth2RedirectURICookieName)
	if err != nil {
		h.config.Log.Warn("reading redirect_uri cookie",
			zap.Error(err),
		)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	redirectURI := redirectURICookie.Value

	_, err = h.authenticate(w, r, redirectURI)
	if err != nil {
		// Error is already logged by authenticate()
		if redirectURI != "" {
			if redirURL, _ := url.Parse(redirectURI); redirURL != nil {
				qs := redirURL.Query()
				errorCode := string(authErrorCodeUnknown)
				errorMessage := err.Error()
				if authErr, ok := err.(AuthError); ok && authErr.ErrorCode() != "" {
					errorCode = authErr.ErrorCode()
				}
				qs.Add("_wg.auth.error.code", errorCode)
				qs.Add("_wg.auth.error.message", errorMessage)
				redirURL.RawQuery = qs.Encode()
				redirectURI = redirURL.String()
			}
			http.Redirect(w, r, redirectURI, http.StatusFound)
		} else {
			w.WriteHeader(http.StatusBadRequest)
		}
	}

	scheme := "https://"
	if !h.config.ForceRedirectHttps {
		scheme = "//"
	}

	if redirectURI == "" {
		redirectURI = fmt.Sprintf("%s%s", scheme, "/auth/cookie/user")
	}

	//http.Redirect(w, r, redirect, http.StatusFound)
	_, _ = fmt.Fprintf(w, "<html><head><script>window.location.replace('%s');</script></head></html>", redirectURI)
}

func (h *OAuth2AuthenticationHandler) authenticate(w http.ResponseWriter, r *http.Request, redirectURI string) (*User, error) {
	errorCode := r.URL.Query().Get("error")
	errorDescription := r.URL.Query().Get("error_description")

	if errorCode != "" || errorDescription != "" {
		return nil, &authError{
			Code: authErrorCode(errorCode),
			Err:  errors.New(errorDescription),
		}
	}

	stateCookie, err := r.Cookie(oauth2StateCookieName)
	if err != nil {
		h.config.Log.Warn("reading state cookie",
			zap.Error(err),
		)
		return nil, &authError{
			Code: authErrorCodeBadCookie,
			Err:  fmt.Errorf("could not read state cookie: %w", err),
		}
	}

	if state := r.URL.Query().Get("state"); state != stateCookie.Value {
		h.config.Log.Warn("state mismatch", zap.String("expected", stateCookie.Value), zap.String("got", state))
		return nil, &authError{
			Code: authErrorCodeBadState,
			Err:  errors.New("state mismatch"),
		}
	}

	callbackURICookie, err := r.Cookie(oauth2CallbackURICookieName)
	if err != nil {
		h.config.Log.Warn("reading callback_uri cookie",
			zap.Error(err),
		)
		return nil, &authError{
			Code: authErrorCodeBadCookie,
			Err:  fmt.Errorf("could not read callback_uri cookie: %w", err),
		}
	}

	oauth2Config := oauth2.Config{
		ClientID:     h.config.ClientID,
		ClientSecret: h.config.ClientSecret,
		Endpoint:     h.config.Endpoint,
		RedirectURL:  callbackURICookie.Value,
		Scopes:       h.config.Scopes,
	}

	oauth2Token, err := oauth2Config.Exchange(r.Context(), r.URL.Query().Get("code"))
	if err != nil {
		h.config.Log.Error("exchanging oauth2 token",
			zap.Error(err),
		)
		return nil, &authError{
			Code: authErrorCodeExchangeFailed,
			Err:  fmt.Errorf("could not exchange token: %w", err),
		}
	}

	user, err := h.retriever.User(r.Context(), h.config.Log, oauth2Token)
	if err != nil {
		h.config.Log.Error("retrieving oauth2 user",
			zap.Error(err),
		)
		return nil, &authError{
			Code: authErrorCodeRetrieveUserFailed,
			Err:  fmt.Errorf("could not retrieve user: %w", err),
		}
	}
	// Fill in remaining fields
	user.ProviderID = h.config.ProviderID

	user, err = postAuthenticationHooks(r.Context(), r, h.config.Hooks, user)
	if err != nil {
		h.config.Log.Error("postAuthentication failed", zap.Error(err))
		return nil, &authError{
			Code: authErrorCodePostAuthentication,
			Err:  err,
		}
	}

	if err := user.Save(h.config.Cookie, w, r, r.Host, h.config.InsecureCookies); err != nil {
		return nil, &authError{
			Code: authErrorCodeSavedFailed,
			Err:  fmt.Errorf("could not encode user data: %w", err),
		}
	}

	return user, nil
}
