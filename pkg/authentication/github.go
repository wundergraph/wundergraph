package authentication

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

type GithubCookieHandler struct {
	auth2 *OAuth2AuthenticationHandler
}

func NewGithubCookieHandler(config GithubConfig, hooks Hooks, log *zap.Logger) *GithubCookieHandler {
	handler := &GithubCookieHandler{}
	handler.auth2 = NewOAuth2AuthenticationHandler(OAuth2AuthenticationConfig{
		ProviderID:   config.ProviderID,
		ClientID:     config.ClientID,
		ClientSecret: config.ClientID,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://github.com/login/oauth/authorize",
			TokenURL: "https://github.com/login/oauth/access_token",
		},
		Scopes:             []string{oidc.ScopeOpenID, "profile", "user:email"},
		AuthTimeout:        config.AuthTimeout,
		ForceRedirectHttps: config.ForceRedirectHttps,
		Hooks:              hooks,
		Cookie:             config.Cookie,
		InsecureCookies:    config.InsecureCookies,
		Log:                log,
	}, handler)
	return handler
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

func (h *GithubCookieHandler) Register(authorizeRouter, callbackRouter *mux.Router) {
	authorizeRouter.Path(fmt.Sprintf("/%s", h.auth2.config.ProviderID)).Methods(http.MethodGet).HandlerFunc(h.auth2.Authorize)
	callbackRouter.Path(fmt.Sprintf("/%s", h.auth2.config.ProviderID)).Methods(http.MethodGet).HandlerFunc(h.auth2.Callback)
}

func (*GithubCookieHandler) User(ctx context.Context, log *zap.Logger, token *oauth2.Token) (*User, error) {
	profileReq, err := http.NewRequest(http.MethodGet, "https://api.github.com/user", nil)
	if err != nil {
		return nil, fmt.Errorf("creating GitHub user profile request: %w", err)
	}

	profileReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))

	client := http.Client{
		Timeout: time.Second * 5,
	}

	profileResp, err := client.Do(profileReq)
	if err != nil {
		return nil, fmt.Errorf("retrieving GitHub user profile: %w", err)
	}
	defer profileResp.Body.Close()

	if profileResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid response code retrieving GitHub user profile: %d", profileResp.StatusCode)
	}

	var userInfo GithubUserInfo
	if err := json.NewDecoder(profileResp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("decoding GitHub user: %w", err)
	}

	emailsReq, err := http.NewRequest(http.MethodGet, "https://api.github.com/user/emails", nil)
	if err != nil {
		return nil, fmt.Errorf("creating GitHub user emails request: %w", err)
	}

	emailsReq.Header.Set("Accept", "application/vnd.github.v3+json")
	emailsReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))

	emailsResp, err := client.Do(emailsReq)
	if err != nil {
		return nil, fmt.Errorf("retrieving GitHub user emails: %w", err)
	}
	defer emailsResp.Body.Close()

	if emailsResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid response code retrieving GitHub user emails: %d", profileResp.StatusCode)
	}

	var userEmails GithubUserEmails
	if err := json.NewDecoder(emailsResp.Body).Decode(&userEmails); err != nil {
		return nil, fmt.Errorf("decoding GitHub emails: %w", err)
	}

	if len(userEmails) == 0 {
		return nil, errors.New("GitHub user has no registered emails")
	}

	email := userEmails[0]
	for _, userEmail := range userEmails {
		if userEmail.Primary {
			email = userEmail
		}
	}

	var idToken string
	accessToken := token.AccessToken
	if maybeIdToken := token.Extra("id_token"); maybeIdToken != nil {
		idToken = maybeIdToken.(string)
	}

	return &User{
		ProviderName:   "github",
		Email:          email.Email,
		EmailVerified:  email.Verified,
		Name:           userInfo.Name,
		NickName:       userInfo.Login,
		UserID:         strconv.FormatInt(userInfo.ID, 10),
		Picture:        userInfo.AvatarURL,
		Location:       userInfo.Location,
		ExpiresAt:      token.Expiry,
		AccessToken:    tryParseJWT(accessToken),
		RawAccessToken: accessToken,
		IdToken:        tryParseJWT(idToken),
		RawIDToken:     idToken,
	}, nil
}
