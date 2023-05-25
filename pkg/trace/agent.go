package trace

import (
	"context"
	"fmt"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.uber.org/zap"
)

const (
	kindOtlpHttp = "otlphttp"
)

var (
	tp *sdktrace.TracerProvider
)

// StartAgent starts an opentelemetry agent.
func StartAgent(log *zap.Logger, c Config) {
	// if error happens, let later calls run.
	if err := startAgent(log, c); err != nil {
		return
	}
}

// StopAgent shuts down the span processors in the order they were registered.
func StopAgent() {
	_ = tp.Shutdown(context.Background())
}

func createExporter(c Config) (sdktrace.SpanExporter, error) {
	// Just support jaeger and zipkin now, more for later
	switch c.Batcher {
	case kindOtlpHttp:
		// Not support flexible configuration now.
		opts := []otlptracehttp.Option{
			otlptracehttp.WithInsecure(),
			otlptracehttp.WithEndpoint(c.Endpoint),
		}
		if len(c.OtlpHeaders) > 0 {
			opts = append(opts, otlptracehttp.WithHeaders(c.OtlpHeaders))
		}
		if len(c.OtlpHttpPath) > 0 {
			opts = append(opts, otlptracehttp.WithURLPath(c.OtlpHttpPath))
		}
		return otlptracehttp.New(
			context.Background(),
			opts...,
		)
	default:
		return nil, fmt.Errorf("unknown exporter: %s", c.Batcher)
	}
}

func startAgent(log *zap.Logger, c Config) error {
	opts := []sdktrace.TracerProviderOption{
		// Set the sampling rate based on the parent span to 100%
		sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(c.Sampler))),
		// Record information about this application in a Resource.
		sdktrace.WithResource(resource.NewSchemaless(semconv.ServiceNameKey.String(c.Name))),
	}

	if len(c.Endpoint) > 0 {
		exp, err := createExporter(c)
		if err != nil {
			log.Error("create exporter error", zap.Error(err))
			return err
		}

		// Always be sure to batch in production.
		opts = append(opts, sdktrace.WithBatcher(exp))
	}

	tp = sdktrace.NewTracerProvider(opts...)
	otel.SetTracerProvider(tp)
	otel.SetErrorHandler(otel.ErrorHandlerFunc(func(err error) {
		log.Error("otel error", zap.Error(err))
	}))

	return nil
}
