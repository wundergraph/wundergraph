package trace

import (
	"context"

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
	switch {
	case config.Endpoint != "":
		opts := []otlptracehttp.Option{
			otlptracehttp.WithEndpoint(config.Endpoint),
		}

		if config.AuthToken != "" {
			opts = append(opts, otlptracehttp.WithHeaders(map[string]string{
				"Authorization": config.AuthToken,
			}))
		}

		client := otlptracehttp.NewClient(opts...)

		return otlptrace.New(ctx, client)
	case config.JaegerEndpoint != "":
		exp, err := jaeger.New(
			jaeger.WithCollectorEndpoint(jaeger.WithEndpoint(config.JaegerEndpoint)),
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
