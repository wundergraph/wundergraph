package trace

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.opentelemetry.io/otel/trace"
)

func TestTracerFromContext(t *testing.T) {
	traceFn := func(ctx context.Context, hasTraceId bool) {
		spanContext := trace.SpanContextFromContext(ctx)
		assert.Equal(t, spanContext.IsValid(), hasTraceId)
		parentTraceId := spanContext.TraceID().String()

		tracer := TracerFromContext(ctx)
		_, span := tracer.Start(ctx, "b")
		defer span.End()

		spanContext = span.SpanContext()
		assert.True(t, spanContext.IsValid())
		if hasTraceId {
			assert.Equal(t, parentTraceId, spanContext.TraceID().String())
		}

	}

	t.Run("context", func(t *testing.T) {
		opts := []sdktrace.TracerProviderOption{
			// Set the sampling rate based on the parent span to 100%
			sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(1))),
			// Record information about this application in a Resource.
			sdktrace.WithResource(resource.NewSchemaless(semconv.ServiceNameKey.String("test"))),
		}
		tp = sdktrace.NewTracerProvider(opts...)
		otel.SetTracerProvider(tp)
		ctx, span := tp.Tracer(TraceName).Start(context.Background(), "a")

		defer span.End()
		traceFn(ctx, true)
	})

	t.Run("global", func(t *testing.T) {
		opts := []sdktrace.TracerProviderOption{
			// Set the sampling rate based on the parent span to 100%
			sdktrace.WithSampler(sdktrace.ParentBased(sdktrace.TraceIDRatioBased(1))),
			// Record information about this application in a Resource.
			sdktrace.WithResource(resource.NewSchemaless(semconv.ServiceNameKey.String("test"))),
		}
		tp = sdktrace.NewTracerProvider(opts...)
		otel.SetTracerProvider(tp)

		traceFn(context.Background(), false)
	})
}
