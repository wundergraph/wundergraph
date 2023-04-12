package trace

import (
	"context"
	"errors"
	"net/url"
	"strings"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/jaeger"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	sdkresource "go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"
)

const (
	defaultJaegerExporterPath = "/api/traces"
)

type TracerProviderConfig struct {
	Endpoint       string
	JaegerEndpoint string
	ServiceName    string
	AuthToken      string
	Enabled        bool
}

type TracerProvider struct {
	Provider trace.TracerProvider
}

func NewTracerProvider(ctx context.Context, config *TracerProviderConfig) (*TracerProvider, error) {
	if !config.Enabled {
		return &TracerProvider{
			Provider: trace.NewNoopTracerProvider(),
		}, nil
	}

	exporter, err := configureExporter(ctx, config)
	if err != nil {
		return nil, err
	}

	p := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(sdkresource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String(config.ServiceName),
		)),
	)

	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return &TracerProvider{Provider: p}, nil
}

func NewNoopTracerProvider() *TracerProvider {
	return &TracerProvider{
		Provider: trace.NewNoopTracerProvider(),
	}
}

func configureExporter(ctx context.Context, config *TracerProviderConfig) (sdktrace.SpanExporter, error) {
	if config.Endpoint != "" && config.JaegerEndpoint != "" {
		return nil, errors.New("cannot configure both OTLP and Jaeger exporters")
	}

	switch {
	case config.Endpoint != "":
		// normalize the endpoint URL, because of the inconsistency in Go and Node.js exporters implementations
		endpoint := config.Endpoint
		if !strings.HasPrefix(endpoint, "http://") && !strings.HasPrefix(endpoint, "https://") {
			endpoint = "https://" + endpoint
		}

		parsedURL, err := url.Parse(endpoint)
		if err != nil {
			return nil, err
		}

		opts := []otlptracehttp.Option{
			otlptracehttp.WithEndpoint(parsedURL.Host),
		}

		// if the path is not empty, use it as the URL path
		// otherwise, the default path will be set by the exporter
		if parsedURL.Path != "" && parsedURL.Path != "/" {
			opts = append(opts, otlptracehttp.WithURLPath(parsedURL.Path))
		}

		if config.AuthToken != "" {
			opts = append(opts, otlptracehttp.WithHeaders(map[string]string{
				"Authorization": config.AuthToken,
			}))
		}

		client := otlptracehttp.NewClient(opts...)

		return otlptrace.New(ctx, client)
	case config.JaegerEndpoint != "":
		// normalize the endpoint URL, because of the inconsistency in Go and Node.js exporters implementations
		endpoint := config.JaegerEndpoint
		if !strings.HasPrefix(endpoint, "http://") && !strings.HasPrefix(endpoint, "https://") {
			endpoint = "https://" + endpoint
		}

		parsedURL, err := url.Parse(endpoint)
		if err != nil {
			return nil, err
		}

		if parsedURL.Path == "" || parsedURL.Path == "/" {
			parsedURL.Path = defaultJaegerExporterPath
		}

		exp, err := jaeger.New(
			jaeger.WithCollectorEndpoint(jaeger.WithEndpoint(parsedURL.String())),
		)
		if err != nil {
			return nil, err
		}

		return exp, nil
	default:
		exp, err := stdouttrace.New(stdouttrace.WithPrettyPrint())
		if err != nil {
			return nil, err
		}

		return exp, nil
	}
}

func (p TracerProvider) Shutdown(ctx context.Context) error {
	if prv, ok := p.Provider.(*sdktrace.TracerProvider); ok {
		return prv.Shutdown(ctx)
	}

	return nil
}
