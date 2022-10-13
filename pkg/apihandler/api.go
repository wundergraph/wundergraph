package apihandler

import (
	"time"

	"github.com/jensneuse/abstractlogger"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Listener struct {
	Host string
	Port uint16
}

type Logging struct {
	Level abstractlogger.Level
}

type Options struct {
	ServerUrl      string
	PublicNodeUrl  string
	Listener       *Listener
	Logging        Logging
	DefaultTimeout time.Duration
}

type Api struct {
	PrimaryHost           string
	Hosts                 []string
	PathPrefix            string
	EngineConfiguration   *wgpb.EngineConfiguration
	EnableSingleFlight    bool
	EnableGraphqlEndpoint bool
	Operations            []*wgpb.Operation
	CorsConfiguration     *wgpb.CorsConfiguration
	DeploymentId          string
	CacheConfig           *wgpb.ApiCacheConfig // TODO: extract from proto
	ApiConfigHash         string
	AuthenticationConfig  *wgpb.ApiAuthenticationConfig
	S3UploadConfiguration []*wgpb.S3UploadConfiguration
	Webhooks              []*wgpb.WebhookConfiguration
	Options               *Options
}

func (api *Api) HasCookieAuthEnabled() bool {
	return api.AuthenticationConfig != nil &&
		api.AuthenticationConfig.CookieBased != nil &&
		len(api.AuthenticationConfig.CookieBased.Providers) > 0
}
