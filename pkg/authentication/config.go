package authentication

import (
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/securecookie"
)

// ProviderConfig holds the common configuration between all
// authentication provider types
type ProviderConfig struct {
	ID              string
	InsecureCookies bool
	// ForceRedirectHttps makes all redirect_uris become HTTPS when
	// redirecting the out provider
	ForceRedirectHttps bool
	Cookie             *securecookie.SecureCookie
	AuthTimeout        time.Duration
	// DefaultRedirectProtocol indicates the protocol used by default
	// when ForceRedirectHttps is false and no protocol could be determined
	DefaultRedirectProtocol string
}

// RedirectProtocol returns the protocol that should be used for a redirect to
// this provider and back into the application, set from the ForceRedirectHttps
// and DefaultRedirectProtocol, and deduced from the client request r when
// those are empty.
func (c *ProviderConfig) RedirectProtocol(r *http.Request) string {
	if c.ForceRedirectHttps {
		return "https"
	}
	if c.DefaultRedirectProtocol != "" {
		return c.DefaultRedirectProtocol
	}
	if looksLikeHTTPS(r) {
		return "https"
	}
	return "http"
}

// looksLikeHttps returns true iff the request looks
// like was sent via HTTPS
func looksLikeHTTPS(r *http.Request) bool {
	// TLS managed by the Go stack
	if r.TLS != nil {
		return true
	}
	// Standard Forwarded header
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded
	forwarded := r.Header.Get("Forwarded")
	if strings.Contains(forwarded, "proto=https") {
		return true
	}
	// Non standard headers used by reverse proxies
	schemeHeaders := []string{
		"X-Forwarded-Proto",
		"X-Url-Scheme",
	}
	for _, h := range schemeHeaders {
		if r.Header.Get(h) == "https" {
			return true
		}
	}
	return false
}
