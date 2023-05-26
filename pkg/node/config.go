package node

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
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

func CreateConfig(graphConfig *wgpb.WunderGraphConfiguration) (*WunderNodeConfig, error) {
	const (
		defaultTimeout = 10 * time.Second
	)

	logLevelStr := loadvariable.String(graphConfig.Api.NodeOptions.Logger.Level)

	logLevel, err := logging.FindLogLevel(logLevelStr)
	if err != nil {
		return nil, err
	}

	nodeHost := loadvariable.String(graphConfig.Api.NodeOptions.Listen.Host)

	var nodePort uint64
	rawNodePort := loadvariable.String(graphConfig.Api.NodeOptions.Listen.Port)
	if rawNodePort != "" {
		nodePort, err = strconv.ParseUint(rawNodePort, 10, 16)
		if err != nil {
			return nil, fmt.Errorf("can't parse node port %s: %w", rawNodePort, err)
		}
	}

	var internalNodePort uint64
	rawInternalNodePort := loadvariable.String(graphConfig.Api.NodeOptions.ListenInternal.Port)
	if rawInternalNodePort != "" {
		internalNodePort, err = strconv.ParseUint(rawInternalNodePort, 10, 16)
		if err != nil {
			return nil, fmt.Errorf("can't parse node internal port %s: %w", rawInternalNodePort, err)
		}
	}

	listener := &apihandler.Listener{
		Host: nodeHost,
		Port: uint16(nodePort),
	}

	internalListener := &apihandler.Listener{
		Host: nodeHost,
		Port: uint16(internalNodePort),
	}

	defaultRequestTimeout := defaultTimeout
	if graphConfig.Api.NodeOptions.DefaultRequestTimeoutSeconds > 0 {
		defaultRequestTimeout = time.Duration(graphConfig.Api.NodeOptions.DefaultRequestTimeoutSeconds) * time.Second
	}

	var defaultHTTPProxyURL *url.URL
	if defaultHTTPProxyURLString := loadvariable.String(graphConfig.Api.GetNodeOptions().GetDefaultHttpProxyUrl()); defaultHTTPProxyURLString != "" {
		defaultHTTPProxyURL, err = url.Parse(defaultHTTPProxyURLString)
		if err != nil {
			return nil, fmt.Errorf("invalid default HTTP proxy URL %q: %w", defaultHTTPProxyURLString, err)
		}
	}

	prometheusConfig := graphConfig.GetApi().GetNodeOptions().GetPrometheus()

	prometheusEnabled, err := loadvariable.Bool(prometheusConfig.GetEnabled())
	if err != nil {
		return nil, err
	}
	prometheusPort, err := loadvariable.Int(prometheusConfig.GetPort())
	if err != nil {
		return nil, err
	}

	otelEnabled, err := loadvariable.Bool(graphConfig.Api.NodeOptions.OpenTelemetry.Enabled)
	if err != nil {
		return nil, err
	}
	otelSampler, err := loadvariable.Float64(graphConfig.Api.NodeOptions.OpenTelemetry.Sampler)
	if err != nil {
		return nil, err
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
			ApiConfigHash:         graphConfig.ConfigHash,
			S3UploadConfiguration: graphConfig.Api.S3UploadConfiguration,
			AuthenticationConfig:  graphConfig.Api.AuthenticationConfig,
			Webhooks:              graphConfig.Api.Webhooks,
			Options: &apihandler.Options{
				ServerUrl:        strings.TrimSuffix(loadvariable.String(graphConfig.Api.ServerOptions.ServerUrl), "/"),
				PublicNodeUrl:    loadvariable.String(graphConfig.Api.NodeOptions.PublicNodeUrl),
				Listener:         listener,
				InternalListener: internalListener,
				Logging: apihandler.Logging{
					Level: logLevel,
				},
				DefaultTimeout:      defaultRequestTimeout,
				DefaultHTTPProxyURL: defaultHTTPProxyURL,
				Prometheus: apihandler.PrometheusOptions{
					Enabled: prometheusEnabled,
					Port:    prometheusPort,
				},
				OpenTelemetry: &apihandler.OpenTelemetry{
					Enabled:              otelEnabled,
					AuthToken:            loadvariable.String(graphConfig.Api.NodeOptions.OpenTelemetry.AuthToken),
					ExporterHTTPEndpoint: loadvariable.String(graphConfig.Api.NodeOptions.OpenTelemetry.ExporterHttpEndpoint),
					Sampler:              otelSampler,
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

	return &config, nil
}
