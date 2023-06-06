// Package cacheheaders implements support HTTP headers related to caching.
//
// Currently, the package handles Cache-Control, Age and ETag
package cacheheaders

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/cespare/xxhash"
)

// CacheControl contains the configuration for the generated Cache-Control header
type CacheControl struct {
	// Public controls wether the Cache-Control is declared as public or private
	Public bool
	// MaxAge indicates the value of the max-age directive, set to <0 to disable
	MaxAge int64
	// StaleWhileRevalidate indicates the value of the stale-while-revalidate directive, set to <0 to disable
	StaleWhileRevalidate int64
	// MustRevalidate indicates whether a must-revalidate directive must be included in Cache-Control
	MustRevalidate bool

	// Override allows override the Cache-Control settings on a per-request basis.
	Override func(r *http.Request, cc CacheControl) CacheControl
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
// If cacheControl is nil, no Cache-Control header is added to responses.
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
	return "enabled: " + c.CacheControl(nil)
}

// ETag returns a en ETag derived from the config hash and the received data
func (c *Headers) ETag(data []byte) string {
	hash := xxhash.New()
	_, _ = hash.Write(c.configHash)
	_, _ = hash.Write(data)
	return fmt.Sprintf("W/\"%d\"", hash.Sum64())
}

// CacheControl returns the value of the configured Cache-Control header for
// the given http.Request (which might be nil)
func (c *Headers) CacheControl(r *http.Request) string {
	if c == nil || c.cacheControl == nil {
		return ""
	}
	cc := c.cacheControl
	if r != nil && cc.Override != nil {
		// Make a copy to avoid allowing the override to overwrite the internal state
		cpy := *cc
		result := cc.Override(r, cpy)
		cc = &result
	}
	return formatCacheControl(cc)
}

// Set sets all the cache related headers
func (c *Headers) Set(r *http.Request, w http.ResponseWriter, data []byte) {

	if cacheControl := c.CacheControl(r); cacheControl != "" {
		w.Header().Set("Cache-Control", cacheControl)
	}
	w.Header().Set("Age", "0")

	if (r != nil && (r.Method == "GET" || r.Method == "HEAD")) && data != nil {
		w.Header()["ETag"] = []string{c.ETag(data)}
	}
}

// NotModified checks the request and response headers and if they indicate
// the the client already has the resource, sends an http.StatusNotModified
// and returns true. If the headers don't match, nothing is done and false
// is returned.
func (c *Headers) NotModified(r *http.Request, w http.ResponseWriter) bool {
	if r != nil && (r.Method == "GET" || r.Method == "HEAD") {
		ifNoneMatch := r.Header.Get("If-None-Match")
		responseEtag := w.Header()["ETag"]
		if len(responseEtag) > 0 && responseEtag[0] == ifNoneMatch {
			w.WriteHeader(http.StatusNotModified)
			return true
		}
	}
	return false
}

func formatCacheControl(cc *CacheControl) string {
	if cc == nil {
		return ""
	}
	publicOrPrivate := "private"
	if cc.Public {
		publicOrPrivate = "public"
	}
	values := make([]string, 0, 4)
	values = append(values, publicOrPrivate)
	if cc.MaxAge >= 0 {
		values = append(values, "max-age="+strconv.FormatInt(cc.MaxAge, 10))
	}
	if cc.StaleWhileRevalidate >= 0 {
		values = append(values, "stale-while-revalidate="+strconv.FormatInt(cc.StaleWhileRevalidate, 10))
	}
	if cc.MustRevalidate {
		values = append(values, "must-revalidate")
	}
	return strings.Join(values, ", ")
}
