package apihandler

import (
	"fmt"
	"math/rand"
	"os"
	"time"

	"go.uber.org/zap/zapcore"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	wgEnvHashKey          = "WUNDERGRAPH_SECURE_COOKIE_HASH_KEY"
	wgEnvBlockKey         = "WUNDERGRAPH_SECURE_COOKIE_BLOCK_KEY"
	wgEnvCsrfSecret       = "WUNDERGRAPH_CSRF_TOKEN_SECRET"
	validSecretCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
)

type Listener struct {
	Host string
	Port uint16
}

type Logging struct {
	Level zapcore.Level
}

type Options struct {
	ServerUrl      string
	PublicNodeUrl  string
	Listener       *Listener
	Logging        Logging
	DefaultTimeout time.Duration
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
	case wgEnvCsrfSecret:
		cookieBasedSecrets.CsrfSecret = secretValue
	case wgEnvBlockKey:
		cookieBasedSecrets.BlockKey = secretValue
	case wgEnvHashKey:
		cookieBasedSecrets.HashKey = secretValue
	}
}

func generateRandomStringOfLength(length int) []byte {
	bytes := make([]byte, length)
	for i := range bytes {
		bytes[i] = validSecretCharacters[rand.Intn(len(validSecretCharacters))]
	}
	return bytes
}

func NewCookieBasedSecrets(isDevMode bool) (cookieBasedSecrets *CookieBasedSecrets, errorMessages []string) {
	if isDevMode {
		return newCookieBasedSecrets(
			[]byte("00000000000"), []byte("00000000000000000000000000000000"), []byte("00000000000000000000000000000000"),
		), nil
	}
	secretNamesAndLength := map[string]int{
		wgEnvCsrfSecret: 11,
		wgEnvHashKey:    32,
		wgEnvBlockKey:   32,
	}
	for k, v := range secretNamesAndLength {
		secret := []byte(os.Getenv(k))
		if len(secret) == v {
			setCookieBasedSecrets(k, secret, cookieBasedSecrets)
			continue
		}
		setCookieBasedSecrets(k, generateRandomStringOfLength(v), cookieBasedSecrets)
		message := fmt.Sprintf("The secret %s was either unset or invalid. An insecure randomised value has been created; please create a secure one.", k)
		errorMessages = append(errorMessages, message)
	}
	return cookieBasedSecrets, errorMessages
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
	DeploymentId          string
	CacheConfig           *wgpb.ApiCacheConfig // TODO: extract from proto
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
