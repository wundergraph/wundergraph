package cachecontrol

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func testHeader(t *testing.T, expected string, fn func(h *Header)) {
	var h Header
	fn(&h)
	assert.Equal(t, expected, h.String(), "header should have correct value")
}

func TestValues(t *testing.T) {
	t.Run("disabled", func(t *testing.T) {
		testHeader(t, "no-cache, no-store, must-revalidate", func(h *Header) {
			h.Disabled()
		})
	})
	t.Run("private then public", func(t *testing.T) {
		testHeader(t, "public", func(h *Header) {
			h.Private().Public()
		})
	})

	t.Run("public or private", func(t *testing.T) {
		testHeader(t, "public", func(h *Header) {
			h.PublicOrPrivate(true)
		})

		testHeader(t, "private", func(h *Header) {
			h.PublicOrPrivate(false)
		})
	})

	t.Run("int headers", func(t *testing.T) {
		testHeader(t, "max-age=0, stale-while-revalidate=0", func(h *Header) {
			h.MaxAge(0).StaleWhileRevalidate(0)
		})
	})

	var disabled Header
	disabled.Disabled()
	assert.Equal(t, disabled.String(), Disabled().String(), ".Disabled() should return the same header as Header.Disabled()")
}

func TestSet(t *testing.T) {
	rec := httptest.NewRecorder()
	var h Header
	h.Public().Set(rec)
	resp := rec.Result()
	defer resp.Body.Close()
	assert.Equal(t, h.String(), resp.Header.Get("Cache-Control"), "Set() should set Cache-Control")
}

func TestMiddleware(t *testing.T) {
	const (
		helloWorld = "Hello World"
	)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.WriteString(w, helloWorld)
	})
	var h Header
	h.Private()
	ts := httptest.NewServer(h.Middleware()(handler))
	defer ts.Close()

	resp, err := http.Get(ts.URL)
	assert.Nil(t, err, "reading URL should not return an error")
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	assert.Nil(t, err, "reading body should not return an error")
	assert.Equal(t, helloWorld, string(data), "returned data should match what handler wrote")
	assert.Equal(t, h.String(), resp.Header.Get("Cache-Control"), "cache control should be the same as the Header")
}
