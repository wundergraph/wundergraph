// Package cachecontrol implements functions for managing Cache-Control directives
package cachecontrol

import (
	"net/http"
	"strconv"
	"strings"
)

// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control for
// information on the different cache values. Not all

// Header represents a series of values for a Cache-Control header.
// The zero value is a valid an empty Cache-Control header. To set the
// header use String(), Set() or Middleware().
type Header struct {
	values []string
}

func (h *Header) append(value string) *Header {
	h.values = append(h.values, value)
	return h
}

func (h *Header) filterOut(value string) *Header {
	// Iterate backwards to not require index adjustment on delete
	for ii := len(h.values) - 1; ii >= 0; ii-- {
		if h.values[ii] == value {
			h.values = append(h.values[:ii], h.values[ii+1:]...)
		}
	}
	return h
}

func (h *Header) intHeader(name string, value int) *Header {
	return h.append(name + "=" + strconv.Itoa(value))
}

// String returns the formatted Cache-Control header
func (h *Header) String() string {
	return strings.Join(h.values, ", ")
}

// Set sets the Cache-Control header into the given http.ResponseWriter
// using h.String().
func (h *Header) Set(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", h.String())
}

// Middleware returns an http.Handler compatible middleware that sets the
// given Header as the Cache-Control header in the ResponseWriter, then calls
// its next http.Handler.
func (h *Header) Middleware() func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			h.Set(w)
			next.ServeHTTP(w, r)
		})
	}
}

func (h *Header) Disabled() *Header {
	h.values = append([]string(nil), "no-cache", "no-store", "must-revalidate")
	return h
}

func (h *Header) Public() *Header {
	return h.filterOut("private").append("public")

}

func (h *Header) Private() *Header {
	return h.filterOut("public").append("private")
}

// PublicOrPrivate is a shorthand for calling Public() iff
// isPublic is true, and calling Private() otherwise
func (h *Header) PublicOrPrivate(isPublic bool) *Header {
	if isPublic {
		return h.Public()
	}
	return h.Private()
}

// MaxAge appends a max-age header
func (h *Header) MaxAge(seconds int) *Header {
	return h.intHeader("max-age", seconds)
}

// StaleWhileRevalidate appends a stale-while-revalidate header
func (h *Header) StaleWhileRevalidate(seconds int) *Header {
	return h.intHeader("stale-while-revalidate", seconds)
}

// Disabled is a shorthand for creating an empty Header
// and calling its Disabled method.
func Disabled() *Header {
	var h Header
	return h.Disabled()
}
