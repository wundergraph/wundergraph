package node

import (
	"fmt"
	"time"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Server struct {
	GracefulShutdownTimeout int64
	KeepAlive               int64
	ReadTimeout             int64
	WriteTimeout            int64
	IdleTimeout             int64
}

type WunderNodeConfig struct {
	Server *Server
	Api    *apihandler.Api
}

func CreateConfig(graphConfig *wgpb.WunderGraphConfiguration) (WunderNodeConfig, error) {
	const (
		defaultTimeout = 10 * time.Second
	)

	logLevelStr := loadvariable.String(graphConfig.Api.NodeOptions.Logger.Level)

	logLevel, err := logging.FindLogLevel(logLevelStr)
	if err != nil {
		return WunderNodeConfig{}, err
	}

	listener := &apihandler.Listener{
		Host: loadvariable.String(graphConfig.Api.NodeOptions.Listen.Host),
		Port: uint16(loadvariable.Int(graphConfig.Api.NodeOptions.Listen.Port)),
	}

	defaultRequestTimeout := defaultTimeout
	if graphConfig.Api.NodeOptions.DefaultRequestTimeoutSeconds > 0 {
		defaultRequestTimeout = time.Duration(graphConfig.Api.NodeOptions.DefaultRequestTimeoutSeconds) * time.Second
	}

	config := WunderNodeConfig{
		Api: &apihandler.Api{
			PrimaryHost:           fmt.Sprintf("%s:%d", listener.Host, listener.Port),
			Hosts:                 loadvariable.Strings(graphConfig.Api.AllowedHostNames),
			EngineConfiguration:   graphConfig.Api.EngineConfiguration,
			EnableSingleFlight:    true,
			EnableGraphqlEndpoint: graphConfig.DangerouslyEnableGraphQLEndpoint,
			Operations:            graphConfig.Api.Operations,
			InvalidOperationNames: graphConfig.Api.InvalidOperationNames,
			CorsConfiguration:     graphConfig.Api.CorsConfiguration,
			S3UploadConfiguration: graphConfig.Api.S3UploadConfiguration,
			CacheConfig: &wgpb.ApiCacheConfig{
				Kind: wgpb.ApiCacheKind_IN_MEMORY_CACHE,
				InMemoryConfig: &wgpb.InMemoryCacheConfig{
					MaxSize: 1e9,
				},
			},
			AuthenticationConfig: graphConfig.Api.AuthenticationConfig,
			Webhooks:             graphConfig.Api.Webhooks,
			Options: &apihandler.Options{
				ServerUrl:     loadvariable.String(graphConfig.Api.ServerOptions.ServerUrl),
				PublicNodeUrl: loadvariable.String(graphConfig.Api.NodeOptions.PublicNodeUrl),
				Listener:      listener,
				Logging: apihandler.Logging{
					Level: logLevel,
				},
				DefaultTimeout: defaultRequestTimeout,
			},
		},
		Server: &Server{
			GracefulShutdownTimeout: 0,
			KeepAlive:               5,
			ReadTimeout:             5,
			WriteTimeout:            5,
			IdleTimeout:             10,
		},
	}

	return config, nil
}
