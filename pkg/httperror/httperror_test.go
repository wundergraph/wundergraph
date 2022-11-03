package httperror

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/wundergraph/wundergraph/pkg/cachecontrol"
)

type tempError struct{}

func (tempError) Error() string {
	return "error"
}

func (tempError) Timeout() bool {
	return true
}

func cacheControlDisabledHeader() string {
	rec := httptest.NewRecorder()
	cachecontrol.DisableCache(rec)
	resp := rec.Result()
	defer resp.Body.Close()
	return resp.Header.Get("Cache-Control")
}

func TestError(t *testing.T) {
	rec := httptest.NewRecorder()
	Error(rec, "error", http.StatusNotFound)
	resp := rec.Result()
	defer resp.Body.Close()

	assert.Equal(t, http.StatusNotFound, resp.StatusCode, "HTTP response code should match Error()")
	assert.Equal(t, cacheControlDisabledHeader(), resp.Header.Get("Cache-Control"), "Cache-Control must disable cache")

	data, err := io.ReadAll(resp.Body)
	assert.Nil(t, err, "reading the body should not return an error")
	assert.Equal(t, "error", strings.TrimSpace(string(data)), "body should be equal to Error() message")
}

func TestErr(t *testing.T) {
	t.Run("non timeout error", func(t *testing.T) {
		rec := httptest.NewRecorder()
		Err(rec, os.ErrNotExist, "")
		resp := rec.Result()
		defer resp.Body.Close()

		assert.Equal(t, http.StatusInternalServerError, resp.StatusCode, "status code should be 500")
		data, err := io.ReadAll(resp.Body)
		assert.Nil(t, err, "reading the body should not return an error")
		assert.Equal(t, http.StatusText(http.StatusInternalServerError), strings.TrimSpace(string(data)), "body should contain error message")
	})

	t.Run("timeout error", func(t *testing.T) {
		rec := httptest.NewRecorder()
		Err(rec, tempError{}, "")
		resp := rec.Result()
		defer resp.Body.Close()

		assert.Equal(t, http.StatusGatewayTimeout, resp.StatusCode, "status code should be 503")
		data, err := io.ReadAll(resp.Body)
		assert.Nil(t, err, "reading the body should not return an error")
		assert.Equal(t, http.StatusText(http.StatusGatewayTimeout), strings.TrimSpace(string(data)), "body should contain error message")
	})
}
