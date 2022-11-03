package cachecontrol

import (
	"net/http/httptest"
	"sort"
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDisableCache(t *testing.T) {
	rec := httptest.NewRecorder()
	DisableCache(rec)
	resp := rec.Result()
	defer resp.Body.Close()

	expectedValues := []string{"no-cache", "no-store", "must-revalidate"}
	sort.Strings(expectedValues)

	actualValues := strings.Split(resp.Header.Get("Cache-Control"), ", ")
	sort.Strings(actualValues)
	assert.Equal(t, expectedValues, actualValues, "should set headers to disable caching")
}

func TestEnableCache(t *testing.T) {
	const (
		maxAge               = 13
		staleWhileRevalidate = 37
	)
	rec := httptest.NewRecorder()
	EnableCache(rec, true, maxAge, staleWhileRevalidate)
	resp := rec.Result()
	defer resp.Body.Close()

	expectedValues := []string{"public", "max-age=" + strconv.Itoa(maxAge), "stale-while-revalidate=" + strconv.Itoa(staleWhileRevalidate)}
	sort.Strings(expectedValues)

	actualValues := strings.Split(resp.Header.Get("Cache-Control"), ", ")
	sort.Strings(actualValues)
	assert.Equal(t, expectedValues, actualValues, "should set headers to enable caching")
}
