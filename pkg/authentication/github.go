package authentication

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

type GithubCookieHandler struct {
	log *zap.Logger
}

func NewGithubCookieHandler(log *zap.Logger) *GithubCookieHandler {
	return &GithubCookieHandler{
		log: log,
	}
}

type GithubConfig struct {
	ClientID           string
	ClientSecret       string
	ProviderID         string
	InsecureCookies    bool
	ForceRedirectHttps bool
	Cookie             *securecookie.SecureCookie
	AuthTimeout        time.Duration
}

type GithubUserInfo struct {
	AvatarURL string `json:"avatar_url"`
	ID        int64  `json:"id"`
	Location  string `json:"location"`
	Login     string `json:"login"`
	Name      string `json:"name"`
	NodeID    string `json:"node_id"`
}

type GithubUserEmails []GithubUserEmail

type GithubUserEmail struct {
	Email      string `json:"email"`
	Primary    bool   `json:"primary"`
	Verified   bool   `json:"verified"`
	Visibility string `json:"visibility"`
}

func (g *GithubCookieHandler) Register(authorizeRouter, callbackRouter *mux.Router, config GithubConfig, hooks Hooks) {

	authorizeRouter.Path(fmt.Sprintf("/%s", config.ProviderID)).Methods(http.MethodGet).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		redirectPath := strings.Replace(r.RequestURI, "authorize", "callback", 1)
		scheme := "https"
		if !config.ForceRedirectHttps && r.TLS == nil {
			scheme = "http"
		}
		redirectURI := fmt.Sprintf("%s://%s%s", scheme, r.Host, redirectPath)

		oauth2Config := oauth2.Config{
			ClientID:     config.ClientID,
			ClientSecret: config.ClientSecret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://github.com/login/oauth/authorize",
				TokenURL: "https://github.com/login/oauth/access_token",
			},
			RedirectURL: redirectURI,
			Scopes:      []string{oidc.ScopeOpenID, "profile", "user:email"},
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
			MaxAge:   int(config.AuthTimeout.Seconds()),
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
			MaxAge:   int(config.AuthTimeout.Seconds()),
			Secure:   r.TLS != nil,
			HttpOnly: true,
			Path:     cookiePath,
			Domain:   cookieDomain,
			SameSite: http.SameSiteLaxMode,
		}
		http.SetCookie(w, c2)

		if redirectOnSuccess := r.URL.Query().Get("redirect_uri"); redirectOnSuccess != "" {
			c3 := &http.Cookie{
				Name:     "success_redirect_uri",
				Value:    redirectOnSuccess,
				MaxAge:   int(config.AuthTimeout.Seconds()),
				Secure:   r.TLS != nil,
				HttpOnly: true,
				Path:     cookiePath,
				Domain:   cookieDomain,
				SameSite: http.SameSiteLaxMode,
			}
			http.SetCookie(w, c3)
		}

		redirect := oauth2Config.AuthCodeURL(state)

		http.Redirect(w, r, redirect, http.StatusFound)
	})

	callbackRouter.Path(fmt.Sprintf("/%s", config.ProviderID)).Methods(http.MethodGet).HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		var (
			userInfo   GithubUserInfo
			userEmails GithubUserEmails
		)

		state, err := r.Cookie("state")
		if err != nil {
			g.log.Warn("GithubCookieHandler state missing",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if r.URL.Query().Get("state") != state.Value {
			g.log.Warn("GithubCookieHandler state mismatch",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		redirectURI, err := r.Cookie("redirect_uri")
		if err != nil {
			g.log.Warn("GithubCookieHandler redirect uri missing",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		oauth2Config := oauth2.Config{
			ClientID:     config.ClientID,
			ClientSecret: config.ClientSecret,
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://github.com/login/oauth/authorize",
				TokenURL: "https://github.com/login/oauth/access_token",
			},
			RedirectURL: redirectURI.Value,
			Scopes:      []string{oidc.ScopeOpenID, "profile", "user:email"},
		}

		oauth2Token, err := oauth2Config.Exchange(r.Context(), r.URL.Query().Get("code"))
		if err != nil {
			g.log.Error("GithubCookieHandler.exchange.token",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		req, err := http.NewRequest(http.MethodGet, "https://api.github.com/user", nil)
		if err != nil {
			g.log.Error("GithubCookieHandler.userInfo.request",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		client := http.Client{
			Timeout: time.Second * 5,
		}

		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", oauth2Token.AccessToken))

		res, err := client.Do(req)
		if err != nil {
			g.log.Error("GithubCookieHandler.userInfo.request.do",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if res.StatusCode != http.StatusOK {
			g.log.Error("GithubCookieHandler.userInfo != 200")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		err = json.NewDecoder(res.Body).Decode(&userInfo)
		if err != nil {
			g.log.Error("GithubCookieHandler.userInfo.decode",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		req, err = http.NewRequest(http.MethodGet, "https://api.github.com/user/emails", nil)
		if err != nil {
			g.log.Error("GithubCookieHandler.user.emails.request",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		req.Header.Set("Accept", "application/vnd.github.v3+json")
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", oauth2Token.AccessToken))

		res, err = client.Do(req)
		if err != nil {
			g.log.Error("GithubCookieHandler.user.emails.request.do",
				zap.Error(err),
			)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		if res.StatusCode != http.StatusOK {
			g.log.Error("GithubCookieHandler.emails != 200")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		err = json.NewDecoder(res.Body).Decode(&userEmails)
		if err != nil {
			g.log.Error("GithubCookieHandler.decode.userEmails",
				zap.Error(err),
			)
			return
		}

		if len(userEmails) == 0 {
			g.log.Error("GithubCookieHandler userEmails nil")
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		email := userEmails[0]
		for _, userEmail := range userEmails {
			if userEmail.Primary {
				email = userEmail
			}
		}

		var (
			idToken string
		)

		accessToken := oauth2Token.AccessToken
		maybeIdToken := oauth2Token.Extra("id_token")
		if maybeIdToken != nil {
			idToken = maybeIdToken.(string)
		}

		user := &User{
			ProviderName:   "github",
			ProviderID:     config.ProviderID,
			Email:          email.Email,
			EmailVerified:  email.Verified,
			Name:           userInfo.Name,
			NickName:       userInfo.Login,
			UserID:         strconv.FormatInt(userInfo.ID, 10),
			Picture:        userInfo.AvatarURL,
			Location:       userInfo.Location,
			ExpiresAt:      oauth2Token.Expiry,
			AccessToken:    tryParseJWT(accessToken),
			RawAccessToken: accessToken,
			IdToken:        tryParseJWT(idToken),
			RawIDToken:     idToken,
		}

		if err := postAuthentication(r.Context(), w, r, hooks, user, config.Cookie, config.InsecureCookies); err != nil {
			g.log.Error("GithubCookieHandler postAuthentication failed", zap.Error(err))
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		scheme := "https"
		if !config.ForceRedirectHttps && r.TLS == nil {
			scheme = "http"
		}

		if redirectOnSuccess, err := r.Cookie("success_redirect_uri"); err == nil {
			_, _ = fmt.Fprintf(w, "<html><head><script>window.location.replace('%s');</script></head></html>", redirectOnSuccess.Value)
			return
		}

		redirect := fmt.Sprintf("%s://%s", scheme, "/auth/cookie/user")

		//http.Redirect(w, r, redirect, http.StatusFound)
		_, _ = fmt.Fprintf(w, "<html><head><script>window.location.replace('%s');</script></head></html>", redirect)
	})
}
