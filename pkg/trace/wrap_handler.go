package trace

import (
	"net/http"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/attribute"
	semconv12 "go.opentelemetry.io/otel/semconv/v1.12.0"
	semconv17 "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"
)

// WrapHandler wraps a http.Handler and instruments it using the given operation name.
// Internally it uses otelhttp.NewHandler and set the span status based on the http response status code.
func WrapHandler(wrappedHandler http.Handler, componentName attribute.KeyValue, opts ...otelhttp.Option) http.Handler {
	// Don't trace health check requests or favicon browser requests
	opts = []otelhttp.Option{
		otelhttp.WithFilter(RequestFilter),
		// TODO: Use router path as span name, high cardinality should be avoided
		otelhttp.WithSpanNameFormatter(SpanNameFormatter),
	}

	setSpanStatusHandler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		span := trace.SpanFromContext(req.Context())

		span.SetAttributes(componentName)

		// Add request target as attribute so we can filter by path and query
		span.SetAttributes(semconv17.HTTPTarget(req.RequestURI))
		// Add the host request header to the span
		span.SetAttributes(semconv12.HTTPHostKey.String(req.Host))

		wrappedHandler.ServeHTTP(w, req)
	})
	return otelhttp.NewHandler(setSpanStatusHandler, "", opts...)
}
