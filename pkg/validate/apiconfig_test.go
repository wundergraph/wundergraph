package validate

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

func TestMustDefineCookieAuthenticationSecrets_Validate(t *testing.T) {

	t.Run("simple valid", func(t *testing.T) {
		valid, _ := ApiConfigWithRules(&wgpb.Api{}, ApiConfigValidationConfig{}, []ApiConfigValidationRule{&MustDefineCookieAuthenticationSecrets{}})
		assert.True(t, valid)
	})

	// if providers slice is empty, cookie based auth is disabled
	// so we always need to pass a provider
	providers := []*wgpb.AuthProvider{
		{
			Id:   "auth",
			Kind: wgpb.AuthProviderKind_AuthProviderOIDC,
		},
	}

	t.Run("all valid", func(t *testing.T) {
		valid, message := ApiConfigWithRules(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaa",
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
				},
			},
		}, ApiConfigValidationConfig{}, []ApiConfigValidationRule{&MustDefineCookieAuthenticationSecrets{}})
		assert.True(t, valid)
		assert.Equal(t, []string{}, message)
	})

	t.Run("csrf missing", func(t *testing.T) {
		valid, message := ApiConfigWithRules(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
				},
			},
		}, ApiConfigValidationConfig{}, []ApiConfigValidationRule{&MustDefineCookieAuthenticationSecrets{}})
		assert.False(t, valid)
		assert.Equal(t, []string{"CSRF secret missing: configureWunderGraphApplication.authentication.cookieBased.csrfTokenSecret, must be exactly 11 chars"}, message)
	})

	t.Run("csrf wrong", func(t *testing.T) {
		valid, message := ApiConfigWithRules(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "a",
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
				},
			},
		}, ApiConfigValidationConfig{}, []ApiConfigValidationRule{&MustDefineCookieAuthenticationSecrets{}})
		assert.False(t, valid)
		assert.Equal(t, []string{"CSRF secret invalid: configureWunderGraphApplication.authentication.cookieBased.csrfTokenSecret, must be exactly 11 chars, got 1"}, message)
	})

	t.Run("blockkey missing", func(t *testing.T) {
		valid, message := ApiConfigWithRules(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaa",
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
				},
			},
		}, ApiConfigValidationConfig{}, []ApiConfigValidationRule{&MustDefineCookieAuthenticationSecrets{}})
		assert.False(t, valid)
		assert.Equal(t, []string{"secure cookie block key missing: configureWunderGraphApplication.authentication.cookieBased.secureCookieBlockKey, must be exactly 32 chars"}, message)
	})

	t.Run("blockkey wrong", func(t *testing.T) {
		valid, message := ApiConfigWithRules(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaa",
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "a",
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
				},
			},
		}, ApiConfigValidationConfig{}, []ApiConfigValidationRule{&MustDefineCookieAuthenticationSecrets{}})
		assert.False(t, valid)
		assert.Equal(t, []string{"secure cookie block key invalid: configureWunderGraphApplication.authentication.cookieBased.secureCookieBlockKey, must be exactly 32 chars, got: 1"}, message)
	})

	t.Run("hashkey missing", func(t *testing.T) {
		valid, message := ApiConfigWithRules(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaa",
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
				},
			},
		}, ApiConfigValidationConfig{}, []ApiConfigValidationRule{&MustDefineCookieAuthenticationSecrets{}})
		assert.False(t, valid)
		assert.Equal(t, []string{"secure cookie hash key invalid: configureWunderGraphApplication.authentication.cookieBased.secureCookieHashKey, must be exactly 32 chars"}, message)
	})

	t.Run("hashkey wrong", func(t *testing.T) {
		valid, message := ApiConfigWithRules(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaa",
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "a",
					},
				},
			},
		}, ApiConfigValidationConfig{}, []ApiConfigValidationRule{&MustDefineCookieAuthenticationSecrets{}})
		assert.False(t, valid)
		assert.Equal(t, []string{"secure cookie hash key invalid: configureWunderGraphApplication.authentication.cookieBased.secureCookieHashKey, must be exactly 32 chars, got: 1"}, message)
	})

	t.Run("all wrong", func(t *testing.T) {
		valid, message := ApiConfigWithRules(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "a",
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "a",
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "a",
					},
				},
			},
		}, ApiConfigValidationConfig{}, []ApiConfigValidationRule{&MustDefineCookieAuthenticationSecrets{}})
		assert.False(t, valid)
		assert.Equal(t, []string{"CSRF secret invalid: configureWunderGraphApplication.authentication.cookieBased.csrfTokenSecret, must be exactly 11 chars, got 1", "secure cookie block key invalid: configureWunderGraphApplication.authentication.cookieBased.secureCookieBlockKey, must be exactly 32 chars, got: 1", "secure cookie hash key invalid: configureWunderGraphApplication.authentication.cookieBased.secureCookieHashKey, must be exactly 32 chars, got: 1"}, message)
	})
}
