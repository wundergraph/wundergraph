package httpidletimeout

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

const (
	timeoutDuration = 200 * time.Millisecond
	maxWait         = timeoutDuration * 2
)

func sendDummyRequest(handler http.Handler, path string) {
	var w httptest.ResponseRecorder
	u := url.URL{
		Path: path,
	}
	r := http.Request{
		Method: "GET",
		URL:    &u,
	}
	handler.ServeHTTP(&w, &r)
}

func TestInitialTimeout(t *testing.T) {
	m := New(timeoutDuration)
	m.Start()
	ctx, cancel := context.WithTimeout(context.Background(), maxWait)
	defer cancel()
	if err := m.Wait(ctx); err != nil {
		t.Error(err)
	}
}

func TestResetTimeout(t *testing.T) {
	m := New(timeoutDuration)
	m.Start()
	defer m.Cancel()

	server := http.NewServeMux()
	server.Handle("/", m.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Sleep a bit to simulate requests requiring some time to execute
		time.Sleep(50 * time.Millisecond)
		_, _ = io.WriteString(w, "Hello World")
	})))

	// Send a bunch of requests in parallel to ensure we are handling
	// multiple requests at the same time.
	for ii := 0; ii < 100; ii++ {
		go sendDummyRequest(server, "/")
	}

	increment := timeoutDuration / 2
	for d := time.Duration(0); d < maxWait; d += increment {
		time.AfterFunc(d, func() {
			sendDummyRequest(server, "/")
		})
	}

	ctx1, cancel1 := context.WithTimeout(context.Background(), maxWait)
	defer cancel1()

	ctx2, cancel2 := context.WithTimeout(context.Background(), maxWait+timeoutDuration)
	defer cancel2()

	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		if err := m.Wait(ctx1); err == nil {
			t.Error("middleware triggered too soon")
		}
	}()

	go func() {
		defer wg.Done()
		if err := m.Wait(ctx2); err != nil {
			t.Error("middleware failed to trigger after reset")
		}
	}()

	wg.Wait()
}

func TestLongLivedRequest(t *testing.T) {
	m := New(timeoutDuration)
	m.Start()
	defer m.Cancel()

	server := http.NewServeMux()
	server.Handle("/", m.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(maxWait)
		_, _ = io.WriteString(w, "Hello World")
	})))

	ctx, cancel := context.WithTimeout(context.Background(), maxWait)
	defer cancel()

	go sendDummyRequest(server, "/")

	if err := m.Wait(ctx); err == nil {
		t.Error("middleware triggered too soon")
	}
}

func TestMultipleTriggers(t *testing.T) {
	m := New(timeoutDuration)
	m.Start()
	defer m.Cancel()

	check := time.AfterFunc(maxWait*2, func() {
		t.Fatal("took too long to trigger twice")
	})
	ctx := context.Background()
	m.Wait(ctx)
	m.Wait(ctx)
	check.Stop()
}

func TestSkip(t *testing.T) {
	const (
		skipPath          = "/test"
		expectedSkipCount = 1
	)
	skipCount := int32(0)
	m := New(timeoutDuration, WithSkip(func(r *http.Request) bool {
		if r.URL.Path == skipPath {
			atomic.AddInt32(&skipCount, 1)
			return true
		}
		return false
	}))

	m.Start()
	defer m.Cancel()

	server := http.NewServeMux()
	server.Handle("/", m.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.WriteString(w, "Hello World")
	})))

	var wg sync.WaitGroup
	wg.Add(4)
	time.AfterFunc(timeoutDuration/2, func() {
		defer wg.Done()
		sendDummyRequest(server, skipPath)
	})

	time.AfterFunc(timeoutDuration-timeoutDuration/10, func() {
		defer wg.Done()
		sendDummyRequest(server, "/")
	})

	ctx1, cancel1 := context.WithTimeout(context.Background(), timeoutDuration+timeoutDuration/2)
	defer cancel1()

	ctx2, cancel2 := context.WithTimeout(context.Background(), maxWait+timeoutDuration)
	defer cancel2()

	go func() {
		defer wg.Done()
		if err := m.Wait(ctx1); !errors.Is(err, context.DeadlineExceeded) {
			t.Errorf("expecting %s, got %s instead", context.DeadlineExceeded, err)
		}
	}()

	go func() {
		defer wg.Done()
		if err := m.Wait(ctx2); err != nil {
			t.Errorf("idle timer resetted incorrectly: %s", err)
		}
	}()

	wg.Wait()

	if atomic.LoadInt32(&skipCount) != expectedSkipCount {
		t.Errorf("expecting skipCount = %d, got %d instead", expectedSkipCount, skipCount)
	}
}
