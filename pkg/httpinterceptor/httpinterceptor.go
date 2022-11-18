// Package httpinterceptor implements helpers for intercepting HTTP requests
package httpinterceptor

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/http"
)

var (
	// ErrContinue is returned by Interceptor.Intercept to indicate
	// that the request should be sent to the parent http.RoundTripper
	ErrContinue = errors.New("continue")
)

type Interceptor interface {
	// Intercept the http.Request, returning an http.Response. If the returned
	// error is ErrContinue, the request is sent. Intercept might consume the
	// Request Body without restoring it, that's handled by the http.RoundTripper
	// returned by New.
	Intercept(r *http.Request) (*http.Response, error)
}

// Func is a function type that implements Interceptor
type Func func(r *http.Request) (*http.Response, error)

func (f Func) Intercept(r *http.Request) (*http.Response, error) {
	return f(r)
}

type roundTripper struct {
	interceptor Interceptor
	parent      http.RoundTripper
}

func (rt *roundTripper) RoundTrip(r *http.Request) (*http.Response, error) {
	var body []byte
	if r.Body != nil {
		defer r.Body.Close()
		var err error
		body, err = io.ReadAll(r.Body)
		if err != nil {
			return nil, fmt.Errorf("error reading body: %w", err)
		}
		r.Body = io.NopCloser(bytes.NewReader(body))
	}
	resp, err := rt.interceptor.Intercept(r)
	if err == ErrContinue {
		// Restore r.Body, fallback to parent
		if body != nil {
			r.Body = io.NopCloser(bytes.NewReader(body))
		}
		resp, err = rt.parent.RoundTrip(r)
	}
	return resp, err
}

var _ http.RoundTripper = (*roundTripper)(nil)

// New returns an http.RoundTripper that intercepts requests using the given
// Interceptor and falls back to parent if ErrContinue is returned.
func New(parent http.RoundTripper, interceptor Interceptor) http.RoundTripper {
	return &roundTripper{
		interceptor: interceptor,
		parent:      parent,
	}
}
