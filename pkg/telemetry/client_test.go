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

		var graphqlResp graphQLResponse
		graphqlResp.Data.CollectMetricsV1.Success = true

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

		var graphqlResp graphQLResponse
		graphqlResp.Errors = []struct {
			Message string `json:"message"`
		}{
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

func TestSendFailOnErrorResponse(t *testing.T) {

	testServer := httptest.NewServer(http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		// Validate method and auth header
		assert.Equal(t, "POST", req.Method)

		res.WriteHeader(http.StatusOK)

		var graphqlResp graphQLResponse
		graphqlResp.Data.CollectMetricsV1.Message = "failed"
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

		var graphqlResp graphQLResponse
		graphqlResp.Data.CollectMetricsV1.Success = true

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
	tags := []MetricTag{{"b", "c"}, {"d", "e"}}
	m1 := &Metric{"a", 1, tags}
	m2 := &Metric{"a", 1, nil}
	m3 := &Metric{"a", 3, nil}
	m4 := &Metric{"b", 1, tags}
	// Tags in reverse order vs m1, should compare as equal
	m5 := &Metric{m1.Name, m1.Value, []MetricTag{tags[1], tags[0]}}
	testCases := []struct {
		a          *Metric
		b          *Metric
		wantsEqual bool
	}{
		{m1, m1, true},
		{m1, m2, false},
		{m1, m3, false},
		{m1, m4, false},
		{m1, m5, true},
	}
	for _, tc := range testCases {
		op := "=="
		if !tc.wantsEqual {
			op = "!="
		}
		t.Run(fmt.Sprintf("%v %s %v", tc.a, op, tc.b), func(t *testing.T) {
			if tc.wantsEqual {
				assert.True(t, tc.a.Equal(tc.b), "should be equal")
				assert.True(t, tc.b.Equal(tc.a), "should be equal")
			} else {
				assert.False(t, tc.a.Equal(tc.b), "should be different")
				assert.False(t, tc.b.Equal(tc.a), "should be different")
			}
		})

	}
}

func TestMetricAddTag(t *testing.T) {
	const (
		tagName  = "tag~"
		tagValue = "tagValue"
	)

	m := &Metric{"metric", 1, nil}

	assert.NotNil(t, m.AddTag("", tagValue), "should fail to add empty tag")
	assert.NotNil(t, m.AddTag(string(invalidTagInitialChar)+"tag", tagValue), "should fail to add invalid tag")
	for _, ch := range invalidTagChars {
		assert.NotNil(t, m.AddTag("tag"+string(ch), "value"), "should fail to tag with invalid character")
	}
	assert.Nil(t, m.AddTag(tagName, tagValue), "should add tag")

	assert.Len(t, m.Tags, 1, "should have one tag")
	assert.Equal(t, tagName, m.Tags[0].Name)
	assert.Equal(t, tagValue, m.Tags[0].Value)

	assert.Error(t, m.AddTag(tagName, ""), "should not add duplicate tag")

	// make sure trying to add a duplicate tag didn't mess the internal state
	assert.Len(t, m.Tags, 1, "should have one tag")
	assert.Equal(t, tagName, m.Tags[0].Name)
	assert.Equal(t, tagValue, m.Tags[0].Value)

}
