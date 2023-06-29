package telemetry

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
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

type DurationMetric func() *Metric

type Client interface {
	Send(metrics []*Metric) error
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

func WithAuthToken(token string) ClientOption {
	return func(c *client) {
		if token != "" {
			c.authToken = token
		}
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

var _ Client = (*client)(nil)

func NewClient(address string, clientInfo *MetricClientInfo, opts ...ClientOption) Client {
	c := &client{
		address:    address,
		clientInfo: *clientInfo,
	}

	if clientInfo.CpuCount == 0 {
		c.clientInfo.CpuCount = runtime.NumCPU()
	}
	if clientInfo.OsName == "" {
		c.clientInfo.OsName = strings.ToUpper(runtime.GOOS)
	}

	for _, opt := range opts {
		opt(c)
	}

	if clientInfo.GitRepoURLHash == "" {
		gitRepoURLHash, err := gitRepoURLHash()
		if err != nil {
			if c.log != nil && c.debug {
				c.log.Debug("error retrieving gitRepoURLHash", zap.Error(err))
			}
		}
		c.clientInfo.GitRepoURLHash = gitRepoURLHash
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
	Metrics    []*Metric        `json:"metrics"`
	ClientInfo MetricClientInfo `json:"clientInfo"`
}

type MetricTag struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// Equal returns true iff both Name and Value are Equal
func (m MetricTag) Equal(other MetricTag) bool {
	return m.Name == other.Name && m.Value == other.Value
}

type Metric struct {
	Name  string      `json:"name"`
	Value float64     `json:"value"`
	Tags  []MetricTag `json:"tags,omitempty"`
}

// Equal returns true iff both Metric instances contain the same data (tags
// might be in different order)
func (m *Metric) Equal(other *Metric) bool {
	if m.Name == other.Name && m.Value == other.Value && len(m.Tags) == len(other.Tags) {
		for _, tag := range m.Tags {
			found := false
			for _, otherTag := range other.Tags {
				if tag.Equal(otherTag) {
					found = true
					break
				}
			}
			if !found {
				return false
			}
		}
		return true
	}
	return false
}

const (
	invalidTagChars       = ";!^="
	invalidTagInitialChar = '~'
)

// AddTag adds a tag to the Metric, validating its name and
// ensuring there are no duplicates.
func (m *Metric) AddTag(name string, value string) error {
	if name == "" {
		return errors.New("tag name is empty")
	}
	if name[0] == invalidTagInitialChar {
		return fmt.Errorf("tag name %q starts with invalid initial character %c", name, invalidTagInitialChar)
	}
	if strings.ContainsAny(name, invalidTagChars) {
		return fmt.Errorf("tag name %q contains invalid characters (%s)", name, invalidTagChars)
	}
	for _, tag := range m.Tags {
		if tag.Name == name {
			return fmt.Errorf("metric already contains a %q tag", name)
		}
	}
	m.Tags = append(m.Tags, MetricTag{
		Name:  name,
		Value: value,
	})
	return nil
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
	IsWGCloud        bool   `json:"isWGCloud"`
	WunderctlVersion string `json:"wunderctlVersion,omitempty"`
	AnonymousID      string `json:"anonymousID,omitempty"`
	GitRepoURLHash   string `json:"gitRepoURLHash,omitempty"`
}

func (c *client) Send(metrics []*Metric) error {
	if c.log != nil && c.debug {
		c.log.Info("Telemetry client info", zap.Any("clientInfo", c.clientInfo))
		for _, m := range metrics {
			c.log.Info("Telemetry Metric", zap.String("Name", m.Name), zap.Float64("Value", m.Value), zap.Any("Tags", m.Tags))
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
func NewUsageMetric(name string) *Metric {
	return &Metric{
		Name:  name,
		Value: 1,
	}
}

// NewDurationMetric starts a duration metric. The duration will be stop when PrepareBatch is called.
func NewDurationMetric(name string) DurationMetric {
	start := time.Now()
	return func() *Metric {
		return &Metric{
			Name:  name,
			Value: time.Since(start).Seconds(),
		}
	}
}
