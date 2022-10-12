// Package httpidletimeout implements an HTTP middleware that triggers
// after a given timeout.
package httpidletimeout

import (
	"context"
	"math"
	"net/http"
	"sync/atomic"
	"time"
)

const (
	infiniteDuration = time.Duration(math.MaxInt64)
)

type event int

const (
	eventResetTimer event = iota
	eventStartTimer
	eventStop
)

// Middleware implements an HTTP middleware that triggers after an idle timeout
// (as in time since the last request completed). To initialize a Middleware,
// use New() passing the idle timeout, then use C() to retrieve the channel where
// notifications are received. To exit cleanly, you should call Cancel() at some point
// to free the resources associated with the Middlware (e.g. with a defer after New()).
type Middleware struct {
	timeout  time.Duration
	counter  uint64
	eventCh  chan event
	notifyCh chan struct{}
}

// New returns a new Middleware which will timeout after the given duration.
// See Middleware for more information.
func New(timeout time.Duration) *Middleware {
	eventCh := make(chan event, 1)
	notifyCh := make(chan struct{}, 1)
	return &Middleware{
		timeout:  timeout,
		eventCh:  eventCh,
		notifyCh: notifyCh,
	}
}

func (m *Middleware) startRequest() {
	if atomic.AddUint64(&m.counter, 1) == 1 {
		m.eventCh <- eventResetTimer
	}
}

func (m *Middleware) endRequest() {
	if atomic.AddUint64(&m.counter, ^uint64(0)) == 0 {
		m.eventCh <- eventStartTimer
	}
}

// Handler returns a handler wrapped by the Middleware
func (m *Middleware) Handler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		m.startRequest()
		// Use defer to ensure m.endRequest() is called even if next.ServeHTTP() panics
		defer m.endRequest()
		next.ServeHTTP(w, r)
	})
}

// HandlerFunc is a shorthand for wrapping http.HandlerFunc handlers
func (m *Middleware) HandlerFunc(next http.HandlerFunc) http.Handler {
	return m.Handler(next)
}

// C returns a read-only channel which will receive an empty struct every
// time Middleware triggers
func (m *Middleware) C() <-chan struct{} {
	return m.notifyCh
}

func (m *Middleware) Start() {
	go func() {
		parent := context.Background()
		ctx, cancel := context.WithTimeout(parent, m.timeout)

		for {
			select {
			case <-ctx.Done():
				// Deadline triggered
				cancel()
				// Avoid blocking here if there are no listeners, otherwise
				// we could block here and not be able to service an event
				select {
				case m.notifyCh <- struct{}{}:
				default:
				}

				// Continue looping
				ctx, cancel = context.WithTimeout(parent, m.timeout)
			case ev := <-m.eventCh:
				cancel()
				switch ev {
				case eventResetTimer:
					ctx, cancel = context.WithTimeout(parent, infiniteDuration)
				case eventStartTimer:
					ctx, cancel = context.WithTimeout(parent, m.timeout)
				case eventStop:
					return
				}
			}
		}
	}()
}

// Cancel makes the Middleware stop triggering timeouts after its timeout
// interval. An stopped Middleware can't be restarted again.
func (m *Middleware) Cancel() {
	m.eventCh <- eventStop
}
