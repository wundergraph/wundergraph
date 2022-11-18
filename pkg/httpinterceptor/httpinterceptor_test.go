package httpinterceptor

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestInterceptor(t *testing.T) {
	client := &http.Client{
		Transport: New(http.DefaultTransport, Func(func(r *http.Request) (*http.Response, error) {
			r.Header.Add("X-Intercepted", "true")
			return nil, ErrContinue
		})),
	}

	resp, err := client.Get("https://httpbin.org/headers")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	dec := json.NewDecoder(resp.Body)
	var decoded = struct {
		Headers map[string]interface{} `json:"headers"`
	}{}
	if err := dec.Decode(&decoded); err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, "true", decoded.Headers["X-Intercepted"], "Request should be intercepted")
}
