package trace

import (
	"context"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

func NewSpan(ctx context.Context, name string) (context.Context, trace.Span) {
	return otel.Tracer("").Start(ctx, name)
}

func SpanFromContext(ctx context.Context) trace.Span {
	return trace.SpanFromContext(ctx)
}

func AddSpanTags(span trace.Span, tags map[string]string) {
	list := make([]attribute.KeyValue, len(tags))

	var i int
	for k, v := range tags {
		list[i] = attribute.Key(k).String(v)
		i++
	}

	span.SetAttributes(list...)
}

func AddSpanEvents(span trace.Span, name string, events map[string]string) {
	list := make([]trace.EventOption, len(events))

	var i int
	for k, v := range events {
		list[i] = trace.WithAttributes(attribute.Key(k).String(v))
		i++
	}

	span.AddEvent(name, list...)
}

func AddSpanError(span trace.Span, err error) {
	span.RecordError(err)
}

func FailSpan(span trace.Span, msg string) {
	span.SetStatus(codes.Error, msg)
}
