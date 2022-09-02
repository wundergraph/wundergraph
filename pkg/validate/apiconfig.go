package validate

import (
	"fmt"

	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

func DefaultApiConfig(api *wgpb.Api, config ApiConfigValidationConfig) (valid bool, messages []string) {
	return ApiConfigWithRules(api, config, []ApiConfigValidationRule{
		&MustDefineCookieAuthenticationSecrets{},
	})
}

func ApiConfigWithRules(api *wgpb.Api, config ApiConfigValidationConfig, rules []ApiConfigValidationRule) (valid bool, messages []string) {
	validator := ApiConfigValidator{
		api:      api,
		config:   config,
		valid:    true,
		rules:    rules,
		messages: []string{},
	}
	return validator.Validate()
}

type ApiConfigValidationConfig struct {
	IgnoreMissingCookieAuthenticationSecrets bool
}

type ApiConfigValidationRule interface {
	Validate(a *ApiConfigValidator)
}

type ApiConfigValidator struct {
	api      *wgpb.Api
	config   ApiConfigValidationConfig
	messages []string
	rules    []ApiConfigValidationRule
	valid    bool
}

func (a *ApiConfigValidator) Validate() (valid bool, messages []string) {
	a.messages = a.messages[:0]
	for i := range a.rules {
		a.rules[i].Validate(a)
	}
	return a.valid, a.messages
}

func (a *ApiConfigValidator) setInvalid(message string) {
	a.valid = false
	a.messages = append(a.messages, message)
}

type MustDefineCookieAuthenticationSecrets struct {
}

func (m *MustDefineCookieAuthenticationSecrets) Validate(a *ApiConfigValidator) {
	if a.config.IgnoreMissingCookieAuthenticationSecrets {
		return
	}
	if a.api == nil || a.api.AuthenticationConfig == nil || a.api.AuthenticationConfig.CookieBased == nil {
		return
	}
	if len(a.api.AuthenticationConfig.CookieBased.Providers) == 0 {
		return
	}
	csrfSecret := loadvariable.String(a.api.AuthenticationConfig.CookieBased.CsrfSecret)
	if csrfSecret == "" {
		a.setInvalid("CSRF secret missing: configureWunderGraphApplication.authentication.cookieBased.csrfTokenSecret, must be exactly 11 chars")
	} else if len(csrfSecret) != 11 {
		a.setInvalid(fmt.Sprintf("CSRF secret invalid: configureWunderGraphApplication.authentication.cookieBased.csrfTokenSecret, must be exactly 11 chars, got %d", len(csrfSecret)))
	}
	blockKey := loadvariable.String(a.api.AuthenticationConfig.CookieBased.BlockKey)
	if blockKey == "" {
		a.setInvalid("secure cookie block key missing: configureWunderGraphApplication.authentication.cookieBased.secureCookieBlockKey, must be exactly 32 chars")
	} else if len(blockKey) != 32 {
		a.setInvalid(fmt.Sprintf("secure cookie block key invalid: configureWunderGraphApplication.authentication.cookieBased.secureCookieBlockKey, must be exactly 32 chars, got: %d", len(blockKey)))
	}
	hashKey := loadvariable.String(a.api.AuthenticationConfig.CookieBased.HashKey)
	if hashKey == "" {
		a.setInvalid("secure cookie hash key invalid: configureWunderGraphApplication.authentication.cookieBased.secureCookieHashKey, must be exactly 32 chars")
	} else if len(hashKey) != 32 {
		a.setInvalid(fmt.Sprintf("secure cookie hash key invalid: configureWunderGraphApplication.authentication.cookieBased.secureCookieHashKey, must be exactly 32 chars, got: %d", len(hashKey)))
	}
}
