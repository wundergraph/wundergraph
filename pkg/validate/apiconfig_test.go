package validate

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

func TestValidateApiConfig(t *testing.T) {
	// if providers slice is empty, cookie based auth is disabled
	// so we always need to pass a provider
	providers := []*wgpb.AuthProvider{
		{
			Id:   "auth",
			Kind: wgpb.AuthProviderKind_AuthProviderOIDC,
		},
	}

	t.Run("all valid", func(t *testing.T) {
		valid, messages := ApiConfig(&wgpb.Api{
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
		})

		assert.True(t, valid)
		assert.Len(t, messages, 0)
	})

	t.Run("authentication.cookieBased.secureCookieBlockKey is required", func(t *testing.T) {
		valid, messages := ApiConfig(&wgpb.Api{
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
		})

		assert.False(t, valid)
		assert.Equal(t, messages[0], "authentication.cookieBased.secureCookieBlockKey is required")
	})

	t.Run("authentication.cookieBased.secureCookieBlockKey is wrong", func(t *testing.T) {
		valid, messages := ApiConfig(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaa",
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaa",
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
					},
				},
			},
		})

		assert.False(t, valid)
		assert.Equal(t, messages[0], "authentication.cookieBased.secureCookieBlockKey must be exactly 32 characters long")
	})

	t.Run("authentication.cookieBased.csrfTokenSecret is required", func(t *testing.T) {
		valid, messages := ApiConfig(&wgpb.Api{
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
		})

		assert.False(t, valid)
		assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret is required")
	})

	t.Run("authentication.cookieBased.csrfTokenSecret is wrong", func(t *testing.T) {
		valid, messages := ApiConfig(&wgpb.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: "aaa",
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
		})

		assert.False(t, valid)
		assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret must be exactly 11 characters long")
	})

	t.Run("authentication.cookieBased.secureCookieHashKey is required", func(t *testing.T) {
		valid, messages := ApiConfig(&wgpb.Api{
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
		})

		assert.False(t, valid)
		assert.Equal(t, messages[0], "authentication.cookieBased.secureCookieHashKey is required")
	})

	t.Run("authentication.cookieBased.secureCookieHashKey is wrong", func(t *testing.T) {
		valid, messages := ApiConfig(&wgpb.Api{
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
						StaticVariableContent: "aaaa",
					},
				},
			},
		})

		assert.False(t, valid)
		assert.Equal(t, messages[0], "authentication.cookieBased.secureCookieHashKey must be exactly 32 characters long")
	})

}
