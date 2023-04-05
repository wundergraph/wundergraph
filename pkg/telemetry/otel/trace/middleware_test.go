package trace_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/propagation"
	oteltrace "go.opentelemetry.io/otel/trace"

	"github.com/wundergraph/wundergraph/pkg/telemetry/otel/trace"
)

var sc = oteltrace.NewSpanContext(oteltrace.SpanContextConfig{
	TraceID:    oteltrace.TraceID{0x01},
	SpanID:     oteltrace.SpanID{0x01},
	Remote:     true,
	TraceFlags: oteltrace.FlagsSampled,
})

func TestHTTPClientTransporter(t *testing.T) {
	prop := propagation.TraceContext{}
	content := []byte("Success!")

	ctx := context.Background()
	ctx = oteltrace.ContextWithRemoteSpanContext(ctx, sc)

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := prop.Extract(r.Context(), propagation.HeaderCarrier(r.Header))
		got := trace.SpanFromContext(ctx).SpanContext()

		assert.Equal(t, sc.TraceID(), got.TraceID())
		assert.True(t, got.IsSampled())
		assert.True(t, got.IsRemote())
		assert.True(t, got.SpanID().IsValid())
		assert.Equal(t, sc.SpanID(), got.SpanID())

		_, err := w.Write(content)
		require.NoError(t, err)
	}))
	defer ts.Close()

	r, err := http.NewRequestWithContext(ctx, http.MethodGet, ts.URL, nil)
	require.NoError(t, err)

	tr := trace.HTTPClientTransporter(http.DefaultTransport, trace.NewNoopTracerProvider().Provider)

	c := http.Client{Transport: tr}
	res, err := c.Do(r)
	require.NoError(t, err)

	body, err := io.ReadAll(res.Body)
	require.NoError(t, err)

	assert.Equal(t, content, body)
}

func TestMuxMiddleware(t *testing.T) {
	var called bool
	router := mux.NewRouter()
	router.Use(trace.MuxMiddleware("test", trace.NewNoopTracerProvider().Provider))

	router.HandleFunc("/operation/Image", func(w http.ResponseWriter, r *http.Request) {
		called = true
		got := trace.SpanFromContext(r.Context()).SpanContext()
		assert.Equal(t, sc, got)
		assert.Equal(t, sc.TraceID(), got.TraceID())
		assert.True(t, got.IsSampled())
		assert.True(t, got.IsRemote())
		assert.True(t, got.SpanID().IsValid())
		assert.Equal(t, sc.SpanID(), got.SpanID())
		w.WriteHeader(http.StatusOK)
	})

	r := httptest.NewRequest("GET", "/operation/Image", nil)
	r = r.WithContext(oteltrace.ContextWithRemoteSpanContext(context.Background(), sc))
	w := httptest.NewRecorder()

	router.ServeHTTP(w, r)
	assert.True(t, called)
}
