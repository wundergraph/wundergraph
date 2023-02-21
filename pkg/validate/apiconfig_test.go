package validate

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	elevenString    = "00000000000"
	thirtyTwoString = "00000000000000000000000000000000"
	incorrectString = "0000"
)

var elevenBytes = []byte(elevenString)
var thirtyTwoBytes = []byte(thirtyTwoString)

func TestValidateApiConfig(t *testing.T) {
	// if providers slice is empty, cookie based auth is disabled,
	// so we always need to pass a provider
	providers := []*wgpb.AuthProvider{
		{
			Id:   "auth",
			Kind: wgpb.AuthProviderKind_AuthProviderOIDC,
		},
	}

	t.Run("cookie-based auth with valid config", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: elevenString,
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: thirtyTwoString,
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: thirtyTwoString,
					},
				},
			},
		})

		assert.True(t, valid)
		assert.Len(t, messages, 0)
	})

	t.Run("if authentication.cookieBased.csrfTokenSecret is not provided, a fallback is used", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: thirtyTwoString,
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: thirtyTwoString,
					},
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenBytes,
				BlockKey:   thirtyTwoBytes,
				HashKey:    thirtyTwoBytes,
			},
		})

		assert.True(t, valid)
		assert.Len(t, messages, 0)
	})

	t.Run("return error if authentication.cookieBased.csrfTokenSecret is invalid", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: incorrectString,
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: thirtyTwoString,
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: thirtyTwoString,
					},
				},
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "authentication.cookieBased.csrfTokenSecret must be exactly 11 characters long", messages[0])
	})

	t.Run("if authentication.cookieBased.secureCookieBlockKey is not provided, a fallback is used", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: elevenString,
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: thirtyTwoString,
					},
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenBytes,
				BlockKey:   thirtyTwoBytes,
				HashKey:    thirtyTwoBytes,
			},
		})

		assert.True(t, valid)
		assert.Len(t, messages, 0)
	})

	t.Run("authentication.cookieBased.secureCookieBlockKey is incorrect", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: elevenString,
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: incorrectString,
					},
				},
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "authentication.cookieBased.secureCookieBlockKey must be exactly 32 characters long", messages[0])
	})

	t.Run("if authentication.cookieBased.secureCookieHashKey is not provided, a fallback is used", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: elevenString,
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: thirtyTwoString,
					},
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenBytes,
				BlockKey:   thirtyTwoBytes,
				HashKey:    thirtyTwoBytes,
			},
		})

		assert.True(t, valid)
		assert.Len(t, messages, 0)
	})

	t.Run("authentication.cookieBased.secureCookieHashKey is invalid", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
					CsrfSecret: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: elevenString,
					},
					BlockKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: thirtyTwoString,
					},
					HashKey: &wgpb.ConfigurationVariable{
						Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
						StaticVariableContent: incorrectString,
					},
				},
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "authentication.cookieBased.secureCookieHashKey must be exactly 32 characters long", messages[0])
	})

	t.Run("no cookie-based authentication is valid", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{},
		})

		assert.True(t, valid)
		assert.Len(t, messages, 0)
	})

	// Secret fallback tests
	t.Run("correct length of secrets returns no errors", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenBytes,
				BlockKey:   thirtyTwoBytes,
				HashKey:    thirtyTwoBytes,
			},
		})

		assert.True(t, valid)
		assert.Equal(t, 0, len(messages))
	})

	t.Run("empty WG_CSRF_TOKEN_SECRET returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WG_CSRF_TOKEN_SECRET must have a length of 11", messages[0])
	})

	t.Run("incorrect length for WG_CSRF_TOKEN_SECRET returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: thirtyTwoBytes,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WG_CSRF_TOKEN_SECRET must have a length of 11", messages[0])
	})

	t.Run("empty WG_SECURE_COOKIE_BLOCK_KEY returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenBytes,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WG_SECURE_COOKIE_BLOCK_KEY must have a length of 32", messages[0])
	})

	t.Run("incorrect length of WG_SECURE_COOKIE_BLOCK_KEY returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenBytes,
				BlockKey:   elevenBytes,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WG_SECURE_COOKIE_BLOCK_KEY must have a length of 32", messages[0])
	})

	t.Run("empty WG_SECURE_COOKIE_HASH_KEY returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenBytes,
				BlockKey:   thirtyTwoBytes,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WG_SECURE_COOKIE_HASH_KEY must have a length of 32", messages[0])
	})

	t.Run("incorrect length of WG_SECURE_COOKIE_HASH_KEY returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenBytes,
				BlockKey:   thirtyTwoBytes,
				HashKey:    elevenBytes,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WG_SECURE_COOKIE_HASH_KEY must have a length of 32", messages[0])
	})
}
