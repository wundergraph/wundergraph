package trace

import (
	"net/http"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

// NewTransport wraps the provided http.RoundTripper with one that
// enriches the span with the operation name and type and set the span status
// Internally it uses otelhttp.NewTransport to instrument the request
func NewTransport(base http.RoundTripper, opts ...otelhttp.Option) http.RoundTripper {
	transport := &transport{
		rt: base,
	}
	// ignore health check requests or favicon browser requests
	opts = append(opts, otelhttp.WithFilter(RequestFilter))

	return otelhttp.NewTransport(
		transport, opts...,
	)
}

type transport struct {
	rt http.RoundTripper
}

func (t *transport) RoundTrip(r *http.Request) (*http.Response, error) {

	// Set the operation name and type
	SetOperationAttributes(r.Context())

	res, err := t.rt.RoundTrip(r)

	// In case of a roundtrip error the span status is set to error
	// by the otelhttp.RoundTrip function. Also status code >= 500 is considered an error

	return res, err
}
