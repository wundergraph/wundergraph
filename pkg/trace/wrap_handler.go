package trace

import (
	"net/http"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// WrapHandler wraps a http.Handler and instruments it using the given operation name.
// Internally it uses otelhttp.NewHandler and set the span status based on the http response status code.
func WrapHandler(wrappedHandler http.Handler, componentName attribute.KeyValue, opts ...otelhttp.Option) http.Handler {
	// Don't trace health check requests or favicon browser requests
	opts = []otelhttp.Option{
		otelhttp.WithFilter(RequestFilter),
		otelhttp.WithSpanNameFormatter(SpanNameFormatter),
	}

	setSpanStatusHandler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		span := trace.SpanFromContext(req.Context())

		span.SetAttributes(componentName)
		wrappedHandler.ServeHTTP(w, req)
	})
	return otelhttp.NewHandler(setSpanStatusHandler, "", opts...)
}
