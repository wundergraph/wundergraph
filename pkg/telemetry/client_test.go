package telemetry

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
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

		var graphqlResp GraphQLResponse
		graphqlResp.Data = map[string]interface{}{
			"CollectMetricsV1": map[string]interface{}{
				"success": true,
			},
		}

		respData, err := json.Marshal(graphqlResp)
		assert.NoError(t, err)

		res.Write(respData)
	}))

	defer testServer.Close()

	client := NewClient(testServer.URL,
		&MetricClientInfo{
			OsName:           "LINUX",
			CpuCount:         1,
			IsCI:             false,
			WunderctlVersion: "0.100.1",
			AnonymousID:      "123456",
		},
		WithTimeout(2*time.Second),
	)

	err := client.Send([]*Metric{NewUsageMetric("foo")})

	assert.NoError(t, err)
}

func TestSendFailOnGraphQLError(t *testing.T) {

	testServer := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		// Validate method and auth header
		assert.Equal(t, "POST", req.Method)

		res.WriteHeader(http.StatusOK)

		var graphqlResp GraphQLResponse
		graphqlResp.Errors = []GraphQLError{
			{"Error"},
		}

		respData, err := json.Marshal(graphqlResp)
		assert.NoError(t, err)

		res.Write(respData)
	}))

	defer testServer.Close()

	client := NewClient(testServer.URL,
		&MetricClientInfo{
			OsName:           "LINUX",
			CpuCount:         1,
			IsCI:             false,
			WunderctlVersion: "0.100.1",
			AnonymousID:      "123456",
		},
		WithTimeout(2*time.Second),
	)

	err := client.Send([]*Metric{NewUsageMetric("foo")})

	assert.Error(t, err, "Expected error on graphql error")
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
		assert.GreaterOrEqual(t, metricReq.Metrics[0].Value, 0.01)

		res.WriteHeader(http.StatusOK)

		var graphqlResp GraphQLResponse
		graphqlResp.Data = map[string]interface{}{
			"CollectMetricsV1": map[string]interface{}{
				"success": true,
			},
		}

		respData, err := json.Marshal(graphqlResp)
		assert.NoError(t, err)

		res.Write(respData)
	}))

	defer testServer.Close()

	client := NewClient(testServer.URL,
		&MetricClientInfo{
			OsName:           "LINUX",
			CpuCount:         1,
			IsCI:             false,
			WunderctlVersion: "0.100.1",
			AnonymousID:      "123456",
		},
		WithTimeout(2*time.Second),
	)

	m := NewDurationMetric("up")

	time.Sleep(10 * time.Millisecond)

	err := client.Send([]*Metric{m()})

	assert.NoError(t, err)
}

func TestMetricEqual(t *testing.T) {
	tags := []MetricTag{{"b", "c"}}
	m1 := &Metric{"a", 1, tags}
	m2 := &Metric{"a", 1, nil}
	m3 := &Metric{"a", 3, nil}
	m4 := &Metric{"b", 1, tags}
	testCases := []struct {
		a     *Metric
		b     *Metric
		equal bool
	}{
		{m1, m1, true},
		{m1, m2, false},
		{m1, m3, false},
		{m1, m4, false},
	}
	for _, tc := range testCases {
		op := "=="
		if !tc.equal {
			op = "!="
		}
		t.Run(fmt.Sprintf("%v %s %v", tc.a, op, tc.b), func(t *testing.T) {
			if tc.equal {
				assert.True(t, tc.a.Equal(tc.b), "should be equal")
				assert.True(t, tc.b.Equal(tc.a), "should be equal")
			} else {
				assert.False(t, tc.a.Equal(tc.b), "should be different")
				assert.False(t, tc.b.Equal(tc.a), "should be different")
			}
		})

	}
}
