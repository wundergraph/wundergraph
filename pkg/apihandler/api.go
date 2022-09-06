package apihandler

import (
	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

type Listener struct {
	Host string
	Port uint16
}

type Options struct {
	Listener *Listener
	Logging  *wgpb.Logging
}

type Api struct {
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
	ServerUrl             string
	Options               *Options
}

func (api *Api) HasCookieAuthEnabled() bool {
	return api.AuthenticationConfig != nil &&
		api.AuthenticationConfig.CookieBased != nil &&
		len(api.AuthenticationConfig.CookieBased.Providers) > 0
}
