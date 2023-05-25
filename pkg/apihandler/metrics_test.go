package apihandler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/wundergraph/wundergraph/pkg/metrics"
)

func TestMetricsHandler(t *testing.T) {
	const prometheusPort = 18881
	m := metrics.NewPrometheus(prometheusPort)
	go func() {
		if err := m.Serve(); err != nil && err != metrics.ErrServerClosed {
			t.Fatal(err)
		}
	}()
	defer func() {
		assert.NoError(t, m.Shutdown(context.Background()))
	}()
	operationMetrics := newOperationMetrics(m, "operation")
	ts := httptest.NewServer(operationMetrics.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		var data interface{}
		if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
			t.Fatal(err)
		}
		if err := json.NewEncoder(w).Encode(data); err != nil {
			t.Fatal(err)
		}
	})))
	defer ts.Close()

	resp1, err := http.Get(ts.URL)
	assert.NoError(t, err)
	defer resp1.Body.Close()
	assert.Equal(t, http.StatusBadRequest, resp1.StatusCode)

	payload := map[string]interface{}{
		"hello": "world",
	}
	encodedPayload, err := json.Marshal(payload)
	assert.NoError(t, err)
	resp2, err := http.Post(ts.URL, "application/json", bytes.NewReader(encodedPayload))
	assert.NoError(t, err)
	defer resp2.Body.Close()
	var decoded interface{}
	err = json.NewDecoder(resp2.Body).Decode(&decoded)
	assert.NoError(t, err)
	assert.Equal(t, payload, decoded)
	assert.Equal(t, http.StatusOK, resp2.StatusCode)

	metrics, err := http.Get(fmt.Sprintf("http://localhost:%d/metrics", prometheusPort))
	assert.NoError(t, err)
	defer metrics.Body.Close()

	data, err := io.ReadAll(metrics.Body)
	assert.NoError(t, err)

	// 2 calls in total
	assert.Contains(t, string(data), `wundernode_http_request_duration_seconds_count{operationName="operation"} 2`)
	assert.Contains(t, string(data), `wundernode_http_request_size_bytes_count{operationName="operation"} 2`)
	assert.Contains(t, string(data), `wundernode_http_response_size_bytes_count{operationName="operation"} 2`)
	// 1 call that resulted in a 200
	assert.Contains(t, string(data), `wundernode_http_requests_total{operationName="operation",statusCode="200"} 1`)
	// 1 call that resulted in a 400
	assert.Contains(t, string(data), `wundernode_http_requests_total{operationName="operation",statusCode="400"} 1`)
}
