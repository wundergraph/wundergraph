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
	Flush() error
	Counter(name string) error
	Gauge(name string, value float64) error
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
	address    string
	httpClient *http.Client
	timeout    time.Duration
	metrics    []Metric
	debug      bool
	clientInfo MetricClientInfo
	log        *zap.Logger
}

func NewClient(address string, clientInfo MetricClientInfo, opts ...ClientOption) Client {
	c := &client{
		address:    address,
		clientInfo: clientInfo,
		metrics:    []Metric{},
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

func (c *client) Counter(name string) error {
	c.metrics = append(c.metrics, Metric{
		Name:  name,
		Value: 1,
	})
	return nil
}

func (c *client) Gauge(name string, value float64) error {
	c.metrics = append(c.metrics, Metric{
		Name:  name,
		Value: value,
	})
	return nil
}

func (c *client) Flush() error {
	if c.log != nil && c.debug {
		c.log.Info("Telemetry client info", zap.Any("clientInfo", c.clientInfo))
		for _, m := range c.metrics {
			c.log.Info("Telemetry Metric", zap.String("Name", m.Name), zap.Float64("Value", m.Value))
		}
	}

	data, err := json.Marshal(MetricRequest{
		Metrics:    c.metrics,
		ClientInfo: c.clientInfo,
	})
	if err != nil {
		return err
	}

	c.metrics = []Metric{}

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
