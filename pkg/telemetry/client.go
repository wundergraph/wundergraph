package telemetry

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/hashicorp/go-retryablehttp"
	"go.uber.org/zap"
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
	// CreateBatch creates an immutable set of metrics and returns a functions that sends all metrics to the server.
	CreateBatch() func() error
	// Track adds a simple metric to the client.
	Track(metric Metric)
	// TrackDuration starts a duration metric. The duration will be stop when the callback is called.
	// The callback will be called when Flush is called.
	TrackDuration(metricFn func() Metric)
}

type ClientOption func(*client)

func WithDebug(debug bool) ClientOption {
	return func(c *client) {
		c.debug = debug
	}
}

func WithLogger(logger *zap.Logger) ClientOption {
	return func(c *client) {
		c.log = logger
	}
}

func WithTimeout(timeout time.Duration) ClientOption {
	return func(c *client) {
		c.timeout = timeout
	}
}

type client struct {
	address           string
	httpClient        *http.Client
	timeout           time.Duration
	metrics           []Metric
	durationMetricFns []func() Metric
	debug             bool
	clientInfo        MetricClientInfo
	log               *zap.Logger
}

func NewClient(address string, clientInfo MetricClientInfo, opts ...ClientOption) Client {
	c := &client{
		address:           address,
		clientInfo:        clientInfo,
		metrics:           []Metric{},
		durationMetricFns: []func() Metric{},
	}

	c.clientInfo.OsName = strings.ToUpper(runtime.GOOS)
	c.clientInfo.CpuCount = runtime.NumCPU()

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
	Metrics    []Metric         `json:"metrics"`
	ClientInfo MetricClientInfo `json:"clientInfo"`
}

type Metric struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
}

type MetricClientInfo struct {
	OsName           string `json:"osName,omitempty"`
	CpuCount         int    `json:"cpuCount,omitempty"`
	IsCI             bool   `json:"isCI,omitempty"`
	WunderctlVersion string `json:"wunderctlVersion,omitempty"`
	AnonymousID      string `json:"anonymousID,omitempty"`
}

func (c *client) Track(metric Metric) {
	c.metrics = append(c.metrics, metric)
}

func (c *client) TrackDuration(metricFn func() Metric) {
	c.durationMetricFns = append(c.durationMetricFns, metricFn)
}

func (c *client) CreateBatch() func() error {
	var metrics []Metric

	metrics = append(metrics, c.metrics...)

	for _, fn := range c.durationMetricFns {
		metrics = append(metrics, fn())
	}

	c.metrics = []Metric{}
	c.durationMetricFns = []func() Metric{}

	return func() error {
		if c.log != nil && c.debug {
			c.log.Info("Telemetry client info", zap.Any("clientInfo", c.clientInfo))
			for _, m := range metrics {
				c.log.Info("Telemetry Metric", zap.String("Name", m.Name), zap.Float64("Value", m.Value))
			}
		}

		data, err := json.Marshal(MetricRequest{
			Metrics:    metrics,
			ClientInfo: c.clientInfo,
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
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			return fmt.Errorf("error sending telemetry data: %s, statusCode: %d", string(data), resp.StatusCode)
		}

		return nil
	}
}

// NewUsageMetric creates a simple metric. The value will be 1.
func NewUsageMetric(name string) Metric {
	return Metric{
		Name:  name,
		Value: 1,
	}
}

// NewDurationMetric starts a duration metric. The duration will be stop when CreateBatch is called.
func NewDurationMetric(name string) func() Metric {
	start := time.Now()
	return func() Metric {
		return Metric{
			Name:  name,
			Value: time.Since(start).Seconds(),
		}
	}
}

// NewGaugeMetric creates a metric which value can be any float64.
func NewGaugeMetric(name string, value float64) Metric {
	return Metric{
		Name:  name,
		Value: 1,
	}
}
