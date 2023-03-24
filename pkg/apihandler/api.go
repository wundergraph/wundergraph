package apihandler

import (
	"time"

	"go.uber.org/zap/zapcore"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Listener struct {
	Host string
	Port uint16
}

type Logging struct {
	Level zapcore.Level
}

type Telemetry struct {
	OtelEnabled                bool
	OtelExporterHTTPEndpoint   string
	OtelExporterJaegerEndpoint string
}

type Options struct {
	ServerUrl      string
	PublicNodeUrl  string
	Listener       *Listener
	Logging        Logging
	DefaultTimeout time.Duration
	OpenTelemetry  *Telemetry
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
}

func (api *Api) HasCookieAuthEnabled() bool {
	return api.AuthenticationConfig != nil &&
		api.AuthenticationConfig.CookieBased != nil &&
		len(api.AuthenticationConfig.CookieBased.Providers) > 0
}
