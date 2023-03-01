package trace

import (
	"context"
	"net/http"

	"github.com/gorilla/mux"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gorilla/mux/otelmux"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
	"go.opentelemetry.io/otel/propagation"
	sdkresource "go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.12.0"
	"go.opentelemetry.io/otel/trace"
)

func HTTPClientTransporter(rt http.RoundTripper) http.RoundTripper {
	propagators := propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	)

	return otelhttp.NewTransport(
		rt,
		otelhttp.WithTracerProvider(otel.GetTracerProvider()),
		otelhttp.WithPropagators(propagators),
	)
}

func MuxMiddleware(service string) mux.MiddlewareFunc {
	propagators := propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	)

	return otelmux.Middleware(
		service,
		otelmux.WithTracerProvider(otel.GetTracerProvider()),
		otelmux.WithPropagators(propagators),
	)
}

type ProviderConfig struct {
	Endpoint    string
	ServiceName string
	Enabled     bool
}

type Provider struct {
	provider trace.TracerProvider
}

func NewProvider(ctx context.Context, config *ProviderConfig) (*Provider, error) {
	if !config.Enabled {
		return &Provider{
			provider: trace.NewNoopTracerProvider(),
		}, nil
	}

	exporter, err := configureExporter(ctx, config)
	if err != nil {
		return nil, err
	}

	p := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(sdkresource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String(config.ServiceName),
		)),
	)

	otel.SetTracerProvider(p)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return &Provider{provider: p}, nil
}

func configureExporter(ctx context.Context, config *ProviderConfig) (sdktrace.SpanExporter, error) {
	switch {
	case config.Endpoint != "":
		client := otlptracehttp.NewClient(
			otlptracehttp.WithInsecure(),
			otlptracehttp.WithEndpoint(config.Endpoint),
		)

		return otlptrace.New(ctx, client)
	default:
		exp, err := stdouttrace.New(stdouttrace.WithPrettyPrint())
		if err != nil {
			return nil, err
		}

		return exp, nil
	}
}

func (p Provider) Shutdown(ctx context.Context) error {
	if prv, ok := p.provider.(*sdktrace.TracerProvider); ok {
		return prv.Shutdown(ctx)
	}

	return nil
}
