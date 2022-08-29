package node

import (
	"path"

	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

func CreateConfig(graphConfig wgpb.WunderGraphConfiguration, primaryHost string, logLevel wgpb.LogLevel) wgpb.WunderNodeConfig {
	config := wgpb.WunderNodeConfig{
		Apis: []*wgpb.Api{
			{
				PrimaryHost:           primaryHost,
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
			},
		},
		Server: &wgpb.Server{
			GracefulShutdownTimeout: 0,
			KeepAlive:               5,
			ReadTimeout:             5,
			WriteTimeout:            5,
			IdleTimeout:             10,
		},
		Logging: &wgpb.Logging{
			Level: logLevel,
		},
	}

	return config
}
