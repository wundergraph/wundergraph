package cacheheaders

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCacheControl(t *testing.T) {
	testCases := []struct {
		cacheControl *CacheControl
		header       string
	}{
		{&CacheControl{
			Public:               true,
			MaxAge:               42,
			StaleWhileRevalidate: 43,
		},
			"public, max-age=42, stale-while-revalidate=43",
		},
		{&CacheControl{},
			"private, max-age=0, stale-while-revalidate=0",
		},
		{
			nil,
			"",
		},
	}
	for _, tc := range testCases {
		t.Run(tc.header, func(t *testing.T) {
			var rc httptest.ResponseRecorder
			headers := New(tc.cacheControl, "")
			headers.Set(&rc, nil)
			result := rc.Result()
			assert.Equal(t, tc.header, result.Header.Get("Cache-Control"))
		})
	}
}

func TestETag(t *testing.T) {
	headers := New(nil, "")

	var rc1 httptest.ResponseRecorder
	headers.Set(&rc1, nil)
	result1 := rc1.Result()
	assert.Len(t, result1.Header["ETag"], 0)

	var rc2 httptest.ResponseRecorder
	headers.Set(&rc2, []byte("something"))
	result2 := rc2.Result()
	assert.Len(t, result2.Header["ETag"], 1)

	// Our ETag headers should be weak etags
	assert.Equal(t, "W", string(result2.Header["ETag"][0][0]))
}

func TestNotModified(t *testing.T) {
	headers := New(nil, "")

	var rc1 httptest.ResponseRecorder
	headers.Set(&rc1, []byte("something"))
	response := rc1.Result()
	etag := response.Header["ETag"][0]
	assert.NotEqual(t, "", etag)

	var rc2 httptest.ResponseRecorder
	rc2.Header()["ETag"] = []string{etag}

	r, err := http.NewRequest("GET", "http://example.com", nil)
	assert.NoError(t, err, "invalid request")
	assert.False(t, headers.NotModified(r, &rc2))

	r.Header.Add("If-None-Match", etag)
	assert.True(t, headers.NotModified(r, &rc2))
	assert.Equal(t, rc2.Result().StatusCode, http.StatusNotModified)
}
