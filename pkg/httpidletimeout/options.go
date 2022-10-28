package httpidletimeout

import "net/http"

// SkipFunc allows filtering requests to make them skip
// resetting the idle timer. See WithSkip()
type SkipFunc func(r *http.Request) bool

type options struct {
	skip SkipFunc
}

type Option func(o *options)

// WithSkip configures a skip function for the timer
// See SkipFunc.
func WithSkip(fn SkipFunc) Option {
	return func(o *options) {
		o.skip = fn
	}
}

func applyOptions(opts []Option) options {
	var o options
	for _, fn := range opts {
		fn(&o)
	}
	return o
}
