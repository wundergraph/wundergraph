package trace

import (
	"context"
	"fmt"
	"net/url"

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
func StartAgent(log *zap.Logger, c Config) (*sdktrace.TracerProvider, error) {
	return startAgent(log, c)
}

func createExporter(c Config) (sdktrace.SpanExporter, error) {
	// Just support OTLP for now. Jaeger has native OTLP support.
	switch c.Batcher {
	case kindOtlpHttp:
		u, err := url.Parse(c.Endpoint)
		if err != nil {
			return nil, fmt.Errorf("invalid OpenTelemetry endpoint: %w", err)
		}

		opts := []otlptracehttp.Option{
			// Includes host and port
			otlptracehttp.WithEndpoint(u.Host),
		}

		if u.Scheme != "https" {
			opts = append(opts, otlptracehttp.WithInsecure())
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

func startAgent(log *zap.Logger, c Config) (*sdktrace.TracerProvider, error) {
	var sampler sdktrace.Sampler
	if c.Sampler == 1 {
		// if sampler is set to 1 then always sample regardless of what the parent conveys
		sampler = sdktrace.AlwaysSample()
	} else {
		sampler = sdktrace.ParentBased(
			sdktrace.TraceIDRatioBased(c.Sampler),
			// By default of the parent span is sampled, the child span will be sampled.
		)
	}
	opts := []sdktrace.TracerProviderOption{
		// Set the sampling rate based on the parent span to 100%
		sdktrace.WithSampler(
			sampler,
		),
		// Record information about this application in a Resource.
		sdktrace.WithResource(resource.NewSchemaless(semconv.ServiceNameKey.String(c.Name))),
	}

	if len(c.Endpoint) > 0 {
		exp, err := createExporter(c)
		if err != nil {
			log.Error("create exporter error", zap.Error(err))
			return nil, err
		}

		// Always be sure to batch in production.
		opts = append(opts,
			sdktrace.WithBatcher(exp,
				sdktrace.WithBatchTimeout(c.BatchTimeout),
				sdktrace.WithMaxExportBatchSize(512),
				sdktrace.WithMaxQueueSize(2048),
			),
		)
	}

	tp := sdktrace.NewTracerProvider(opts...)
	otel.SetTracerProvider(tp)
	otel.SetErrorHandler(otel.ErrorHandlerFunc(func(err error) {
		log.Error("otel error", zap.Error(err))
	}))

	return tp, nil
}
