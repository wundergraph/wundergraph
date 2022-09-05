package node

import (
	"path"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

type Server struct {
	GracefulShutdownTimeout int64
	KeepAlive               int64
	ReadTimeout             int64
	WriteTimeout            int64
	IdleTimeout             int64
}

type WunderNodeConfig struct {
	Server *Server         `protobuf:"bytes,1,opt,name=server,proto3" json:"server,omitempty"`
	Api    *apihandler.Api `protobuf:"bytes,3,rep,name=apis,proto3" json:"apis,omitempty"`
}

func CreateConfig(graphConfig *wgpb.WunderGraphConfiguration) WunderNodeConfig {
	config := WunderNodeConfig{
		Api: &apihandler.Api{
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
			ServerUrl:            loadvariable.String(graphConfig.Api.ServerOptions.ServerUrl),
			Options: &apihandler.Options{
				Listener: &apihandler.Listener{
					Host: loadvariable.String(graphConfig.Api.ServerOptions.Listen.Host),
					Port: uint16(loadvariable.Int(graphConfig.Api.ServerOptions.Listen.Port)),
				},
				Logging: graphConfig.Api.NodeOptions.Logger,
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
