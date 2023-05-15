package apihandler

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net/url"
	"os"
	"time"

	"go.uber.org/zap/zapcore"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	WgEnvCsrfSecret       = "WG_CSRF_TOKEN_SECRET"
	WgEnvHashKey          = "WG_SECURE_COOKIE_HASH_KEY"
	WgEnvBlockKey         = "WG_SECURE_COOKIE_BLOCK_KEY"
	validSecretCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-"
)

type Listener struct {
	Host string
	Port uint16
}

type Logging struct {
	Level zapcore.Level
}

type Options struct {
	ServerUrl           string
	PublicNodeUrl       string
	Listener            *Listener
	InternalListener    *Listener
	Logging             Logging
	DefaultTimeout      time.Duration
	DefaultHTTPProxyURL *url.URL
}

type CookieBasedSecrets struct {
	CsrfSecret []byte
	BlockKey   []byte
	HashKey    []byte
}

func newCookieBasedSecrets(csrfSecret, blockKey, hashKey []byte) *CookieBasedSecrets {
	return &CookieBasedSecrets{
		// 11 chars
		CsrfSecret: csrfSecret,
		// 32 chars
		BlockKey: blockKey,
		// 32 chars
		HashKey: hashKey,
	}
}

func setCookieBasedSecrets(secretName string, secretValue []byte, cookieBasedSecrets *CookieBasedSecrets) {
	switch secretName {
	case WgEnvCsrfSecret:
		cookieBasedSecrets.CsrfSecret = secretValue
	case WgEnvBlockKey:
		cookieBasedSecrets.BlockKey = secretValue
	case WgEnvHashKey:
		cookieBasedSecrets.HashKey = secretValue
	}
}

func generateRandomBytesOfLength(length int) ([]byte, error) {
	bytes := make([]byte, length)
	validSecretCharactersLength := len(validSecretCharacters)

	for i := range bytes {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(validSecretCharactersLength)))
		if err != nil {
			return nil, err
		}
		bytes[i] = validSecretCharacters[num.Int64()]
	}

	return bytes, nil
}
func NewDevModeCookieBasedSecrets() (cookieBasedSecrets *CookieBasedSecrets, errorMessages []string) {
	return newCookieBasedSecrets(
		[]byte("00000000000"), []byte("00000000000000000000000000000000"), []byte("00000000000000000000000000000000"),
	), nil
}

func NewCookieBasedSecrets() (cookieBasedSecrets *CookieBasedSecrets, warnMessages []string) {
	secretNamesAndLength := map[string]int{
		WgEnvCsrfSecret: 11,
		WgEnvHashKey:    32,
		WgEnvBlockKey:   32,
	}
	cookieBasedSecrets = &CookieBasedSecrets{}
	for k, v := range secretNamesAndLength {
		secret := os.Getenv(k)
		// if the length is incorrect, it is handled in the validation stage
		if secret == "" {
			bytes, err := generateRandomBytesOfLength(v)
			if err != nil {
				unsetWarning := fmt.Sprintf("The secret %s was unset and your system failed to produce a secure, randomly-generated string. Please generate a new one. https://docs.wundergraph.com/docs/self-hosted/security", k)
				return cookieBasedSecrets, append(warnMessages, unsetWarning)
			}
			setCookieBasedSecrets(k, bytes, cookieBasedSecrets)
			unsetWarning := fmt.Sprintf("The secret %s was unset. A temporary randomised value has been created; please generate a new one. https://docs.wundergraph.com/docs/self-hosted/security", k)
			warnMessages = append(warnMessages, unsetWarning)
		} else {
			setCookieBasedSecrets(k, []byte(secret), cookieBasedSecrets)
		}
	}
	return cookieBasedSecrets, warnMessages
}

type Api struct {
	PrimaryHost           string
	Hosts                 []string
	EngineConfiguration   *wgpb.EngineConfiguration
	EnableSingleFlight    bool
	EnableGraphqlEndpoint bool
	Operations            []*wgpb.Operation
	InvalidOperationNames []string
	CorsConfiguration     *wgpb.CorsConfiguration
	ApiConfigHash         string
	AuthenticationConfig  *wgpb.ApiAuthenticationConfig
	S3UploadConfiguration []*wgpb.S3UploadConfiguration
	Webhooks              []*wgpb.WebhookConfiguration
	Options               *Options
	CookieBasedSecrets    *CookieBasedSecrets
}

func (api *Api) HasCookieAuthEnabled() bool {
	return api.AuthenticationConfig != nil &&
		api.AuthenticationConfig.CookieBased != nil &&
		len(api.AuthenticationConfig.CookieBased.Providers) > 0
}
