package telemetry

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/hashicorp/go-retryablehttp"
	"go.uber.org/zap"
)

var userAgent = "wg-telemetry-client"

const (
	DefaultTimeout = 5
)

type DurationMetric func() Metric

type Client interface {
	Send(metrics []Metric) error
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
	debug      bool
	clientInfo MetricClientInfo
	log        *zap.Logger
	authToken  string
}

func NewClient(address string, clientInfo MetricClientInfo, opts ...ClientOption) Client {
	c := &client{
		address:    address,
		clientInfo: clientInfo,
	}

	c.authToken = os.Getenv("WG_TELEMETRY_AUTH_TOKEN")

	if clientInfo.CpuCount == 0 {
		c.clientInfo.CpuCount = runtime.NumCPU()
	}
	if clientInfo.OsName == "" {
		c.clientInfo.OsName = strings.ToUpper(runtime.GOOS)
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
		retryClient.RetryMax = 3
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

type GraphQLResponse struct {
	Data   interface{} `json:"data"`
	Errors []GraphQLError
}

type GraphQLError struct {
	Message string `json:"message"`
}

type MetricClientInfo struct {
	OsName           string `json:"osName,omitempty"`
	CpuCount         int    `json:"cpuCount,omitempty"`
	IsCI             bool   `json:"isCI"`
	WunderctlVersion string `json:"wunderctlVersion,omitempty"`
	AnonymousID      string `json:"anonymousID,omitempty"`
}

func (c *client) Send(metrics []Metric) error {
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
	if c.authToken != "" {
		req.Header.Add("X-WG-TELEMETRY-AUTHORIZATION", fmt.Sprintf("Bearer %s", c.authToken))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("error sending telemetry data: %s, statusCode: %d", string(data), resp.StatusCode)
	}

	respData, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var graphqlResp GraphQLResponse
	err = json.Unmarshal(respData, &graphqlResp)
	if err != nil {
		return err
	}

	if len(graphqlResp.Errors) > 0 {
		return fmt.Errorf("error sending telemetry data: %s, statusCode: %d, errors: %s", string(data), resp.StatusCode, graphqlResp.Errors[0].Message)
	}

	return nil
}

// NewUsageMetric creates a simple metric. The value will be 1.
func NewUsageMetric(name string) Metric {
	return Metric{
		Name:  name,
		Value: 1,
	}
}

// NewDurationMetric starts a duration metric. The duration will be stop when PrepareBatch is called.
func NewDurationMetric(name string) DurationMetric {
	start := time.Now()
	return func() Metric {
		return Metric{
			Name:  name,
			Value: time.Since(start).Seconds(),
		}
	}
}
