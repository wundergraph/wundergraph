package customhttpclient

import "net/http"

// RequestTag is used to tag requests we trigger from WunderGraph
// and avoid circular dependencies
type RequestTag string

const (
	headerName = "X-Wg-Request-Tag"
)

const (
	// RequestTagUserInfo indicates the request is fetching
	// the userInfo endpoint for token based authentication
	RequestTagUserInfo RequestTag = "userInfo"
	// RequestTagNone indicates the request had no valid tag
	RequestTagNone RequestTag = ""
)

// Tag retrieves the tag for an incoming request. If the header missing or
// present but with an unknown value, it returns RequestTagNone.
func Tag(r *http.Request) RequestTag {
	value := r.Header.Get(headerName)
	switch t := RequestTag(value); t {
	case RequestTagUserInfo:
		return t
	}
	return RequestTagNone
}

// SetTag tags an outgoing request with the given tag
func SetTag(r *http.Request, tag RequestTag) {
	r.Header.Add(headerName, string(tag))
}
