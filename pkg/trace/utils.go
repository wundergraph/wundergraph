package trace

import (
	"context"
	"fmt"
	"net/http"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"

	"github.com/wundergraph/wundergraph/pkg/operation"
)

// TracerFromContext returns a tracer in ctx, otherwise returns a global tracer.
func TracerFromContext(ctx context.Context) (tracer trace.Tracer) {
	if span := trace.SpanFromContext(ctx); span.SpanContext().IsValid() {
		tracer = span.TracerProvider().Tracer(TraceName)
	} else {
		tracer = otel.Tracer(TraceName)
	}

	return
}

func SetOperationAttributes(ctx context.Context) {
	span := trace.SpanFromContext(ctx)
	if span.SpanContext().IsValid() {
		metaData := operation.MetadataFromContext(ctx)
		if metaData != nil {
			span.SetAttributes(
				WgOperationName.String(metaData.OperationName),
				WgOperationType.String(metaData.GetOperationTypeString()),
			)
		}
	}
}

// SpanNameFormatter formats the span name based on the http request
func SpanNameFormatter(_operation string, r *http.Request) string {
	return fmt.Sprintf("%s %s", r.Method, r.URL.Path)
}

func RequestFilter(req *http.Request) bool {
	if req.URL.Path == "/health" || req.URL.Path == "/favicon.ico" {
		return false
	}
	return true
}
