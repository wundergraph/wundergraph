package trace

import (
	"context"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"net/http"

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
		metaData := operation.GetOperationMetaData(ctx)
		if metaData != nil {
			span.SetAttributes(
				WgOperationName.String(metaData.OperationName),
				WgOperationType.String(metaData.GetOperationTypeString()),
			)
		}
	}
}

// SetStatus sets the span status based on the http status code
// if the status code is >= 400 the span status is set to error
// this allows to see the error rate in the traces
// by default the default instrumentation does not interpret the response
func SetStatus(span trace.Span, statusCode int) {
	if statusCode >= 400 {
		span.SetStatus(codes.Error, http.StatusText(statusCode))
	}
}
