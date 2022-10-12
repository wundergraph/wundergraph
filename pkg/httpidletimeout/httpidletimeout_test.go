package httpidletimeout

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"
)

const (
	timeoutDuration = 200 * time.Millisecond
	maxWait         = timeoutDuration * 2
)

func testHandler(w http.ResponseWriter, r *http.Request) {
	time.Sleep(100 * time.Millisecond)
	_, _ = io.WriteString(w, "Hello World")
}

func sendDummyRequest(handler http.Handler) {
	var w httptest.ResponseRecorder
	u := url.URL{
		Path: "/",
	}
	r := http.Request{
		Method: "GET",
		URL:    &u,
	}
	handler.ServeHTTP(&w, &r)
}

func TestInitialTimeout(t *testing.T) {
	before := time.Now()
	m := New(timeoutDuration)
	timer := time.NewTimer(maxWait)
	for {
		select {
		case <-m.C():
			t.Logf("middleware triggered after %s", time.Since(before))
			return
		case <-timer.C:
			t.Fatal("middleware timer didn't fire up in time")
		}
	}
}

func TestResetTimeout(t *testing.T) {
	m := New(timeoutDuration)
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
		go sendDummyRequest(server)
	}

	increment := timeoutDuration / 2
	for d := time.Duration(0); d < maxWait; d += increment {
		time.AfterFunc(d, func() {
			sendDummyRequest(server)
		})
	}

	timer1 := time.NewTimer(maxWait)
	timer2 := time.NewTimer(maxWait + timeoutDuration)

LOOP:
	for {
		select {
		case <-m.C():
			t.Fatal("middleware triggered too soon")
		case <-timer1.C:
			break LOOP
		}
	}

	for {
		select {
		case <-m.C():
			return
		case <-timer2.C:
			t.Fatal("middleware failed to trigger after reset")
		}
	}
}

func TestLongLivedRequest(t *testing.T) {
	m := New(timeoutDuration)
	defer m.Cancel()

	server := http.NewServeMux()
	server.Handle("/", m.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(maxWait)
		_, _ = io.WriteString(w, "Hello World")
	})))

	timer := time.NewTimer(maxWait)

	go sendDummyRequest(server)

	for {
		select {
		case <-m.C():
			t.Fatal("middleware triggered too soon")
		case <-timer.C:
			return
		}
	}
}
