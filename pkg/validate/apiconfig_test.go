package validate

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

var elevenCharSecret = []byte("00000000000")
var thirtyTwoCharSecret = []byte("00000000000000000000000000000000")

func TestValidateApiConfig(t *testing.T) {
	// if providers slice is empty, cookie based auth is disabled,
	// so we always need to pass a provider
	providers := []*wgpb.AuthProvider{
		{
			Id:   "auth",
			Kind: wgpb.AuthProviderKind_AuthProviderOIDC,
		},
	}

	t.Run("no cookie-based authentication is valid", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{},
		})

		assert.True(t, valid)
		assert.Len(t, messages, 0)
	})

	t.Run("correct length of secrets returns no errors", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenCharSecret,
				BlockKey:   thirtyTwoCharSecret,
				HashKey:    thirtyTwoCharSecret,
			},
		})

		assert.True(t, valid)
		assert.Equal(t, 0, len(messages))
	})

	t.Run("empty WUNDERGRAPH_CSRF_TOKEN_SECRET returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WUNDERGRAPH_CSRF_TOKEN_SECRET must have a length of 11", messages[0])
	})

	t.Run("incorrect length for WUNDERGRAPH_CSRF_TOKEN_SECRET returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: thirtyTwoCharSecret,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WUNDERGRAPH_CSRF_TOKEN_SECRET must have a length of 11", messages[0])
	})

	t.Run("empty WUNDERGRAPH_SECURE_COOKIE_BLOCK_KEY returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenCharSecret,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WUNDERGRAPH_SECURE_COOKIE_BLOCK_KEY must have a length of 32", messages[0])
	})

	t.Run("incorrect length of WUNDERGRAPH_SECURE_COOKIE_BLOCK_KEY returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenCharSecret,
				BlockKey:   elevenCharSecret,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WUNDERGRAPH_SECURE_COOKIE_BLOCK_KEY must have a length of 32", messages[0])
	})

	t.Run("empty WUNDERGRAPH_SECURE_COOKIE_HASH_KEY returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenCharSecret,
				BlockKey:   thirtyTwoCharSecret,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WUNDERGRAPH_SECURE_COOKIE_HASH_KEY must have a length of 32", messages[0])
	})

	t.Run("incorrect length of WUNDERGRAPH_SECURE_COOKIE_HASH_KEY returns error", func(t *testing.T) {
		valid, messages := ApiConfig(&apihandler.Api{
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					Providers: providers,
				},
			},
			CookieBasedSecrets: &apihandler.CookieBasedSecrets{
				CsrfSecret: elevenCharSecret,
				BlockKey:   thirtyTwoCharSecret,
				HashKey:    elevenCharSecret,
			},
		})

		assert.False(t, valid)
		assert.Equal(t, "the required environment variable WUNDERGRAPH_SECURE_COOKIE_HASH_KEY must have a length of 32", messages[0])
	})
}
