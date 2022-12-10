package telemetry

import (
	"encoding/json"
	"github.com/stretchr/testify/assert"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestSendUsageMetric(t *testing.T) {

	testServer := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		// Validate method and auth header
		assert.Equal(t, "POST", req.Method)

		// Validate the request body
		metrics, err := io.ReadAll(req.Body)
		assert.NoError(t, err)

		var metricReq MetricRequest
		_ = json.Unmarshal(metrics, &metricReq)

		assert.Equal(t, metricReq.Metrics[0].Name, "foo")
		assert.Equal(t, metricReq.Metrics[0].Value, 1.0)

		assert.Equal(t, metricReq.ClientInfo.OsName, "LINUX")
		assert.Equal(t, metricReq.ClientInfo.IsCI, false)
		assert.Equal(t, metricReq.ClientInfo.WunderctlVersion, "0.100.1")
		assert.Equal(t, metricReq.ClientInfo.AnonymousID, "123456")
		assert.Equal(t, metricReq.ClientInfo.CpuCount, 1)

		res.WriteHeader(http.StatusOK)
	}))

	defer testServer.Close()

	client := NewClient(testServer.URL,
		MetricClientInfo{
			OsName:           "LINUX",
			CpuCount:         1,
			IsCI:             false,
			WunderctlVersion: "0.100.1",
			AnonymousID:      "123456",
		},
		WithTimeout(2*time.Second),
	)

	err := client.Send([]Metric{NewUsageMetric("foo")})

	assert.NoError(t, err)
}

func TestSendDurationMetric(t *testing.T) {

	testServer := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		// Validate method and auth header
		assert.Equal(t, "POST", req.Method)

		// Validate the request body
		metrics, err := io.ReadAll(req.Body)
		assert.NoError(t, err)

		var metricReq MetricRequest
		_ = json.Unmarshal(metrics, &metricReq)

		assert.Equal(t, metricReq.Metrics[0].Name, "up")
		assert.GreaterOrEqual(t, metricReq.Metrics[0].Value, 0.001)

		res.WriteHeader(http.StatusOK)
	}))

	defer testServer.Close()

	client := NewClient(testServer.URL,
		MetricClientInfo{
			OsName:           "LINUX",
			CpuCount:         1,
			IsCI:             false,
			WunderctlVersion: "0.100.1",
			AnonymousID:      "123456",
		},
		WithTimeout(2*time.Second),
	)

	m := NewDurationMetric("up")

	time.Sleep(100 * time.Microsecond)

	err := client.Send([]Metric{m()})

	assert.NoError(t, err)
}
