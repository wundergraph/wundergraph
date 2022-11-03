// Package cachecontrol implements functions for managing Cache-Control directives
package cachecontrol

import (
	"fmt"
	"net/http"
)

// DisableCache sets the Cache-Control header in the given http.ResponseWriter
// to disable all HTTP caching.
func DisableCache(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
}

// DisableCache sets the Cache-Control header in the given http.ResponseWriter
// to enable HTTP caching with the given visibility, max-age and stale-while-revalidate
func EnableCache(w http.ResponseWriter, publicOrPrivate bool, maxAge int, staleWhileRevalidate int) {
	visibility := "private"
	if publicOrPrivate {
		visibility = "public"
	}
	header := fmt.Sprintf("%s, max-age=%d, stale-while-revalidate=%d", visibility, maxAge, staleWhileRevalidate)
	w.Header().Set("Cache-Control", header)
}
