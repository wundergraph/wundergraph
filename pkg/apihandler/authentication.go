package apihandler

import (
	"github.com/gorilla/securecookie"
	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
	"go.uber.org/zap"
)

func authenticationHooks(api *Api, client *hooks.Client, log *zap.Logger) authentication.Hooks {
	return hooks.NewAuthenticationHooks(hooks.AuthenticationConfig{
		Client:                     client,
		Log:                        log,
		PostAuthentication:         api.AuthenticationConfig.Hooks.PostAuthentication,
		MutatingPostAuthentication: api.AuthenticationConfig.Hooks.MutatingPostAuthentication,
		PostLogout:                 api.AuthenticationConfig.Hooks.PostLogout,
		Revalidate:                 api.AuthenticationConfig.Hooks.RevalidateAuthentication,
	})
}

func loadUserConfiguration(api *Api, client *hooks.Client, log *zap.Logger) (authentication.LoadUserConfig, error) {
	var hashKey, blockKey, csrfSecret []byte

	if h := loadvariable.String(api.AuthenticationConfig.CookieBased.HashKey); h != "" {
		hashKey = []byte(h)
	} else if fallback := api.CookieBasedSecrets.HashKey; fallback != nil {
		hashKey = fallback
	}

	if b := loadvariable.String(api.AuthenticationConfig.CookieBased.BlockKey); b != "" {
		blockKey = []byte(b)
	} else if fallback := api.CookieBasedSecrets.BlockKey; fallback != nil {
		blockKey = fallback
	}

	if c := loadvariable.String(api.AuthenticationConfig.CookieBased.CsrfSecret); c != "" {
		csrfSecret = []byte(c)
	} else if fallback := api.CookieBasedSecrets.CsrfSecret; fallback != nil {
		csrfSecret = fallback
	}

	if api == nil || api.HasCookieAuthEnabled() && (hashKey == nil || blockKey == nil || csrfSecret == nil) {
		panic("API is nil or hashkey, blockkey, csrfsecret invalid: This should never have happened. Either validation didn't detect broken configuration, or someone broke the validation code")
	}

	cookie := securecookie.New(hashKey, blockKey)

	var jwksProviders []*wgpb.JwksAuthProvider
	if api.AuthenticationConfig.JwksBased != nil {
		jwksProviders = api.AuthenticationConfig.JwksBased.Providers
	}

	authHooks := authenticationHooks(api, client, log)

	return authentication.LoadUserConfig{
		Log:           log,
		Cookie:        cookie,
		CSRFSecret:    csrfSecret,
		JwksProviders: jwksProviders,
		Hooks:         authHooks,
	}, nil
}
