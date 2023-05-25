package trace

import (
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel/trace"
	"net/http"
)

// NewTransport wraps the provided http.RoundTripper with one that
// enriches the span with the operation name and type and set the span status
// Internally it uses otelhttp.NewTransport to instrument the request
func NewTransport(base http.RoundTripper, opts ...otelhttp.Option) http.RoundTripper {
	transport := &transport{
		rt: base,
	}

	return otelhttp.NewTransport(
		transport, opts...,
	)
}

type transport struct {
	rt http.RoundTripper
}

func (t *transport) RoundTrip(r *http.Request) (*http.Response, error) {
	span := trace.SpanFromContext(r.Context())

	SetOperationAttributes(r.Context())

	res, err := t.rt.RoundTrip(r)

	SetStatus(span, res.StatusCode)

	return res, err
}
