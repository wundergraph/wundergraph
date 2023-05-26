package trace

import (
	"fmt"
	"github.com/felixge/httpsnoop"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/trace"
	"net/http"
)

// WrapHandler wraps a http.Handler and instruments it using the given operation name.
// Internally it uses otelhttp.NewHandler and set the span status based on the http response status code.
// It uses a response writer wrapper to get the status code.
func WrapHandler(wrappedHandler http.Handler, operation string, opts ...otelhttp.Option) http.Handler {
	opts = append(opts, otelhttp.WithSpanNameFormatter(func(operation string, r *http.Request) string {
		return fmt.Sprintf("%s %s", r.Method, r.URL.Path)
	}))

	setSpanStatusHandler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		span := trace.SpanFromContext(req.Context())
		span.SetAttributes(WgComponentName.String(operation))

		m := httpsnoop.CaptureMetrics(wrappedHandler, w, req)

		SetStatus(span, m.Code)
	})
	return otelhttp.NewHandler(setSpanStatusHandler, operation, opts...)
}
