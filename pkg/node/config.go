package node

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/wundergraph/wundergraph/pkg/files"
	"go.uber.org/zap"

	"github.com/docker/go-units"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	defaultInMemoryCacheSize    = int64(128 * units.MB)
	wgInMemoryCacheConfigEnvKey = "WG_IN_MEMORY_CACHE"
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

type AppendConfig func(cfg *WunderNodeConfig)

func CreateConfig(graphConfig *wgpb.WunderGraphConfiguration, modifiers ...AppendConfig) (*WunderNodeConfig, error) {
	const (
		defaultTimeout = 10 * time.Second
	)

	logLevelStr := loadvariable.String(graphConfig.Api.NodeOptions.Logger.Level)

	logLevel, err := logging.FindLogLevel(logLevelStr)
	if err != nil {
		return nil, err
	}

	listener := &apihandler.Listener{
		Host: loadvariable.String(graphConfig.Api.NodeOptions.Listen.Host),
		Port: uint16(loadvariable.Int(graphConfig.Api.NodeOptions.Listen.Port)),
	}

	defaultRequestTimeout := defaultTimeout
	if graphConfig.Api.NodeOptions.DefaultRequestTimeoutSeconds > 0 {
		defaultRequestTimeout = time.Duration(graphConfig.Api.NodeOptions.DefaultRequestTimeoutSeconds) * time.Second
	}

	var cacheConfig *wgpb.ApiCacheConfig
	inMemoryCacheConfig := os.Getenv(wgInMemoryCacheConfigEnvKey)
	if strings.ToLower(inMemoryCacheConfig) != "off" {
		cacheSize := defaultInMemoryCacheSize
		if inMemoryCacheConfig != "" {
			cacheSize, err = units.RAMInBytes(inMemoryCacheConfig)
			if err != nil {
				return nil, fmt.Errorf("can't parse %s = %q: %w", wgInMemoryCacheConfigEnvKey, inMemoryCacheConfig, err)
			}
		}
		if cacheSize > 0 {
			cacheConfig = &wgpb.ApiCacheConfig{
				Kind: wgpb.ApiCacheKind_IN_MEMORY_CACHE,
				InMemoryConfig: &wgpb.InMemoryCacheConfig{
					MaxSize: cacheSize,
				},
			}
		}
	}

	config := &WunderNodeConfig{
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
			CacheConfig:           cacheConfig,
			AuthenticationConfig:  graphConfig.Api.AuthenticationConfig,
			Webhooks:              graphConfig.Api.Webhooks,
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

	for _, modifier := range modifiers {
		modifier(config)
	}

	return config, nil
}

func ReadAndCreateConfig(configFilePath string, log *zap.Logger, modifiers ...AppendConfig) (*WunderNodeConfig, error) {
	if !files.FileExists(configFilePath) {
		return nil, fmt.Errorf("could not find configuration file: %s", configFilePath)
	}

	data, err := os.ReadFile(configFilePath)
	if err != nil {
		log.Error("Failed to read file", zap.String("filePath", configFilePath), zap.Error(err))
		return nil, err
	}

	if len(data) == 0 {
		log.Error("Config file is empty", zap.String("filePath", configFilePath))
		return nil, errors.New("config file is empty")
	}

	var graphConfig wgpb.WunderGraphConfiguration
	err = json.Unmarshal(data, &graphConfig)
	if err != nil {
		log.Error("Failed to unmarshal", zap.String("filePath", configFilePath), zap.Error(err))
		return nil, errors.New("failed to unmarshal config file")
	}

	wunderNodeConfig, err := CreateConfig(&graphConfig, modifiers...)
	if err != nil {
		log.Error("Failed to create config", zap.String("filePath", configFilePath), zap.Error(err))
		return nil, err
	}

	return wunderNodeConfig, nil
}
