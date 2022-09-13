package node

import (
	"fmt"
	"path"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
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

func CreateConfig(graphConfig *wgpb.WunderGraphConfiguration) WunderNodeConfig {
	logLevelStr := loadvariable.String(graphConfig.Api.NodeOptions.Logger.Level)
	logLevel := wgpb.LogLevel(wgpb.LogLevel_value[logLevelStr])

	listener := &apihandler.Listener{
		Host: loadvariable.String(graphConfig.Api.NodeOptions.Listen.Host),
		Port: uint16(loadvariable.Int(graphConfig.Api.NodeOptions.Listen.Port)),
	}

	config := WunderNodeConfig{
		Api: &apihandler.Api{
			PrimaryHost:           fmt.Sprintf("%s:%d", listener.Host, listener.Port),
			Hosts:                 loadvariable.Strings(graphConfig.Api.AllowedHostNames),
			PathPrefix:            path.Join(graphConfig.ApiName, graphConfig.DeploymentName),
			EngineConfiguration:   graphConfig.Api.EngineConfiguration,
			EnableSingleFlight:    true,
			EnableGraphqlEndpoint: graphConfig.DangerouslyEnableGraphQLEndpoint,
			Operations:            graphConfig.Api.Operations,
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
				ServerUrl: loadvariable.String(graphConfig.Api.ServerOptions.ServerUrl),
				Listener:  listener,
				Logging: apihandler.Logging{
					Level: logLevel,
				},
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

	return config
}
