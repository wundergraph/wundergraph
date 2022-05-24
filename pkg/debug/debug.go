package debug

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"time"
)

type Transport struct {
	wrapped http.RoundTripper
}

func NewTransport(wrapped http.RoundTripper) *Transport {
	return &Transport{
		wrapped: wrapped,
	}
}

func (t *Transport) RoundTrip(request *http.Request) (*http.Response, error) {

	requestDump, _ := httputil.DumpRequest(request, true)
	start := time.Now()
	response, err := t.wrapped.RoundTrip(request)
	duration := time.Since(start).Milliseconds()
	responseDump, _ := httputil.DumpResponse(response, true)

	fmt.Printf("\n\n--- DebugTransport ---\n\nRequest:\n\n%s\n\nDuration: %d ms\n\nResponse:\n\n%s\n\n--- DebugTransport\n\n",
		string(requestDump),
		duration,
		string(responseDump),
	)

	return response, err
}
