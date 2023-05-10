// Package cacheheaders implements support HTTP headers related to caching.
//
// Currently, the package handles Cache-Control, Age and ETag
package cacheheaders

import (
	"fmt"
	"net/http"

	"github.com/cespare/xxhash"
)

// CacheControl contains the configuration for the generated Cache-Control header
type CacheControl struct {
	MaxAge               int64
	Public               bool
	StaleWhileRevalidate int64
}

// Headers provides support for returning the cache related headers.
// To initialize a Headers, call New().
type Headers struct {
	// Cache-Control configuration. If nil, no Cache-Control is sent
	cacheControl *CacheControl
	// configHash is the hash of the full application configuration. We use it as part
	// of the cache keys to ensure any changes to the config invalidate the cache
	configHash []byte
}

// newCacheHandler returns a new cacheHandler from a *cacheConfig representing
// the cache configuration for an operation and the API configuration hash (typically from Api.ApiConfigHash)
func New(cacheControl *CacheControl, configHash string) *Headers {
	return &Headers{
		cacheControl: cacheControl,
		configHash:   []byte(configHash),
	}
}

// String returns a description of the Headers, used for log messages
func (c *Headers) String() string {
	if c == nil || c.cacheControl == nil {
		return "disabled"
	}
	return "enabled: " + c.CacheControl()
}

// ETag returns a en ETag derived from the config hash and the received data
func (c *Headers) ETag(data []byte) string {
	hash := xxhash.New()
	_, _ = hash.Write(c.configHash)
	_, _ = hash.Write(data)
	return fmt.Sprintf("W/\"%d\"", hash.Sum64())
}

// CacheControl returns the value of the configured Cache-Control header
func (c *Headers) CacheControl() string {
	if c == nil || c.cacheControl == nil {
		return ""
	}
	config := c.cacheControl
	publicOrPrivate := "private"
	if config.Public {
		publicOrPrivate = "public"
	}
	return fmt.Sprintf("%s, max-age=%d, stale-while-revalidate=%d", publicOrPrivate, config.MaxAge, config.StaleWhileRevalidate)
}

// Set sets all the cache related headers
func (c *Headers) Set(w http.ResponseWriter, data []byte) {

	if cacheControl := c.CacheControl(); cacheControl != "" {
		w.Header().Set("Cache-Control", cacheControl)
	}
	w.Header().Set("Age", "0")

	if data != nil {
		w.Header()["ETag"] = []string{c.ETag(data)}
	}
}

// NotModified checks the request and response headers and if they indicate
// the the client already has the resource, sends an http.StatusNotModified
// and returns true. If the headers don't match, nothing is done and false
// is returned.
func (c *Headers) NotModified(r *http.Request, w http.ResponseWriter) bool {
	ifNoneMatch := r.Header.Get("If-None-Match")
	responseEtag := w.Header()["ETag"]
	if len(responseEtag) > 0 && responseEtag[0] == ifNoneMatch {
		w.WriteHeader(http.StatusNotModified)
		return true
	}
	return false
}
