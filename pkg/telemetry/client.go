package telemetry

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/hashicorp/go-retryablehttp"
	"net/http"
	"runtime"
	"strings"
	"time"
)

var userAgent = "wg-telemetry-client"

const (
	DefaultTimeout = 5
)

type Client interface {
	Flush(clientInfo MetricClientInfo) error
	Increment(name string) error
	Gauge(name string, value float64) error
}

type ClientOption func(*client)

func WithTimeout(timeout time.Duration) ClientOption {
	return func(c *client) {
		c.timeout = timeout
	}
}

type client struct {
	address    string
	httpClient *http.Client
	timeout    time.Duration
	metrics    []metric
}

func NewClient(address string, opts ...ClientOption) Client {
	c := &client{
		address: address,
		metrics: []metric{},
	}

	for _, opt := range opts {
		opt(c)
	}

	if c.timeout == 0 {
		c.timeout = DefaultTimeout * time.Second
	}

	if c.httpClient == nil {
		retryClient := retryablehttp.NewClient()
		retryClient.HTTPClient.Timeout = c.timeout
		retryClient.RetryMax = 1
		retryClient.Logger = nil
		c.httpClient = retryClient.StandardClient()
	}

	return c
}

type MetricRequest struct {
	Metrics    []metric         `json:"metrics"`
	ClientInfo MetricClientInfo `json:"clientInfo"`
}

type metric struct {
	name  string  `json:"name"`
	value float64 `json:"value"`
}

type MetricClientInfo struct {
	OsName           string `json:"osName,omitempty"`
	CpuCount         int    `json:"cpuCount,omitempty"`
	IsDevelopment    bool   `json:"isDevelopment,omitempty"`
	IsCI             bool   `json:"isCI,omitempty"`
	WunderctlVersion string `json:"wunderctlVersion,omitempty"`
	AnonymousID      string `json:"anonymousID,omitempty"`
}

func (c *client) Increment(name string) error {
	c.metrics = append(c.metrics, metric{
		name: name,
	})
	return nil
}

func (c *client) Gauge(name string, value float64) error {
	c.metrics = append(c.metrics, metric{
		name:  name,
		value: value,
	})
	return nil
}

func (c *client) Flush(clientInfo MetricClientInfo) error {
	clientInfo.OsName = strings.ToUpper(runtime.GOOS)
	clientInfo.CpuCount = runtime.NumCPU()

	data, err := json.Marshal(MetricRequest{
		Metrics:    c.metrics,
		ClientInfo: clientInfo,
	})
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", c.address+"/operations/CollectMetricsV1", bytes.NewBuffer(data))
	if err != nil {
		return err
	}

	req.Header.Set("User-Agent", userAgent)
	req.Header.Add("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}

	if resp.StatusCode != 200 {
		return fmt.Errorf("error sending telemetry data: %s, statusCode: %d", string(data), resp.StatusCode)
	}

	c.metrics = []metric{}

	return nil
}
