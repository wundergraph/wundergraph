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
	WgEnvCsrfSecret       = "WUNDERGRAPH_CSRF_TOKEN_SECRET"
	WgEnvHashKey          = "WUNDERGRAPH_SECURE_COOKIE_HASH_KEY"
	WgEnvBlockKey         = "WUNDERGRAPH_SECURE_COOKIE_BLOCK_KEY"
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
	case WgEnvCsrfSecret:
		cookieBasedSecrets.CsrfSecret = secretValue
	case WgEnvBlockKey:
		cookieBasedSecrets.BlockKey = secretValue
	case WgEnvHashKey:
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
		WgEnvCsrfSecret: 11,
		WgEnvHashKey:    32,
		WgEnvBlockKey:   32,
	}
	cookieBasedSecrets = &CookieBasedSecrets{}
	for k, v := range secretNamesAndLength {
		secret := os.Getenv(k)
		// if the length is incorrect, it is handled in the validation stage
		if secret == "" {
			setCookieBasedSecrets(k, generateRandomStringOfLength(v), cookieBasedSecrets)
			message := fmt.Sprintf("The secret %s was unset. A temporary randomised value has been created; please generate a new one.", k)
			errorMessages = append(errorMessages, message)
		} else {
			setCookieBasedSecrets(k, []byte(secret), cookieBasedSecrets)
		}
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
