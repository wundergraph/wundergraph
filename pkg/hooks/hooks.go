package hooks

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/buger/jsonparser"
	"github.com/hashicorp/go-retryablehttp"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/pool"
)

type WunderGraphRequest struct {
	Method     string            `json:"method"`
	RequestURI string            `json:"requestURI"`
	Headers    map[string]string `json:"headers"`
	Body       json.RawMessage   `json:"body,omitempty"`
}

type WunderGraphResponse struct {
	StatusCode int               `json:"statusCode"`
	Status     string            `json:"status"`
	Method     string            `json:"method"`
	RequestURI string            `json:"requestURI"`
	Headers    map[string]string `json:"headers"`
	Body       json.RawMessage   `json:"body,omitempty"`
}

func HttpRequestToWunderGraphRequestJSON(r *http.Request, withBody bool) ([]byte, error) {
	var body []byte
	if withBody {
		body, _ = ioutil.ReadAll(r.Body)
		r.Body = ioutil.NopCloser(bytes.NewBuffer(body))
	}
	return json.Marshal(WunderGraphRequest{
		Method:     r.Method,
		RequestURI: r.URL.String(),
		Headers:    HeaderSliceToCSV(r.Header),
		Body:       body,
	})
}

func HeaderSliceToCSV(headers map[string][]string) map[string]string {
	result := make(map[string]string, len(headers))
	for k, v := range headers {
		result[k] = strings.Join(v, ",")
	}
	return result
}

func HeaderCSVToSlice(headers map[string]string) map[string][]string {
	result := make(map[string][]string, len(headers))
	for k, v := range headers {
		result[k] = []string{v}
	}
	return result
}

type HookResponse interface {
	ResponseError() string
}

type OnWsConnectionInitHookPayload struct {
	DataSourceID string             `json:"dataSourceId"`
	Request      WunderGraphRequest `json:"request"`
}

type OnRequestHookPayload struct {
	Request       WunderGraphRequest `json:"request"`
	OperationName string             `json:"operationName"`
	OperationType string             `json:"operationType"`
}

type OnRequestHookResponse struct {
	Skip    bool                `json:"skip"`
	Cancel  bool                `json:"cancel"`
	Request *WunderGraphRequest `json:"request"`
}

type OnResponseHookPayload struct {
	Response      WunderGraphResponse `json:"response"`
	OperationName string              `json:"operationName"`
	OperationType string              `json:"operationType"`
}

type OnResponseHookResponse struct {
	Skip     bool                 `json:"skip"`
	Cancel   bool                 `json:"cancel"`
	Response *WunderGraphResponse `json:"response"`
}

type MiddlewareHookResponse struct {
	Error                   string            `json:"error,omitempty"`
	Op                      string            `json:"op"`
	Hook                    string            `json:"hook"`
	Response                json.RawMessage   `json:"response"`
	Input                   json.RawMessage   `json:"input"`
	SetClientRequestHeaders map[string]string `json:"setClientRequestHeaders"`
}

func (r *MiddlewareHookResponse) ResponseError() string { return r.Error }

type UploadHookResponse struct {
	Error   string `json:"error"`
	FileKey string `json:"fileKey"`
}

func (r *UploadHookResponse) ResponseError() string { return r.Error }

type MiddlewareHook string

const (
	MockResolve                MiddlewareHook = "mockResolve"
	PreResolve                 MiddlewareHook = "preResolve"
	PostResolve                MiddlewareHook = "postResolve"
	CustomResolve              MiddlewareHook = "customResolve"
	MutatingPreResolve         MiddlewareHook = "mutatingPreResolve"
	MutatingPostResolve        MiddlewareHook = "mutatingPostResolve"
	PostAuthentication         MiddlewareHook = "postAuthentication"
	PostLogout                 MiddlewareHook = "postLogout"
	MutatingPostAuthentication MiddlewareHook = "mutatingPostAuthentication"
	RevalidateAuthentication   MiddlewareHook = "revalidateAuthentication"

	// HttpTransportOnRequest to the origin
	HttpTransportOnRequest MiddlewareHook = "onOriginRequest"
	// HttpTransportOnResponse from the origin
	HttpTransportOnResponse MiddlewareHook = "onOriginResponse"

	WsTransportOnConnectionInit MiddlewareHook = "onConnectionInit"
)

type UploadHook string

const (
	PreUpload  UploadHook = "preUpload"
	PostUpload UploadHook = "postUpload"
)

type Client struct {
	serverUrl           string
	httpClient          *retryablehttp.Client
	subscriptionsClient *retryablehttp.Client
	log                 *zap.Logger
}

func NewClient(serverUrl string, logger *zap.Logger) *Client {
	return &Client{
		serverUrl:           serverUrl,
		httpClient:          buildClient(60 * time.Second),
		subscriptionsClient: buildClient(0),
		log:                 logger,
	}
}

func buildClient(requestTimeout time.Duration) *retryablehttp.Client {
	httpClient := retryablehttp.NewClient()
	// we will try 40 times with a constant delay of 50ms after max 2s we will give up
	httpClient.RetryMax = 40
	// keep it low and linear to increase the chance
	// that we can continue as soon as the server is back from a cold start
	httpClient.Backoff = retryablehttp.LinearJitterBackoff
	httpClient.RetryWaitMax = 50 * time.Millisecond
	httpClient.RetryWaitMin = 50 * time.Millisecond
	httpClient.HTTPClient.Timeout = requestTimeout
	httpClient.Logger = log.New(ioutil.Discard, "", log.LstdFlags)
	return httpClient
}

func (c *Client) DoGlobalRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "global/httpTransport", hook, jsonData)
}

func (c *Client) DoWsTransportRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "global/wsTransport", hook, jsonData)
}

func (c *Client) DoOperationRequest(ctx context.Context, operationName string, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "operation/"+operationName, hook, jsonData)
}

func (c *Client) DoFunctionRequest(ctx context.Context, operationName string, jsonData []byte) (*MiddlewareHookResponse, error) {
	jsonData = c.setInternalHookData(ctx, jsonData)
	r, err := http.NewRequestWithContext(ctx, "POST", c.serverUrl+"/functions/"+operationName, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	r.Header.Set("Content-Type", "application/json")
	r.Header.Set(logging.RequestIDHeader, logging.RequestIDFromContext(ctx))

	req, err := retryablehttp.FromRequest(r)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error calling function %s: %w", operationName, err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error calling function %s: %s", operationName, resp.Status)
	}

	dec := json.NewDecoder(resp.Body)

	var hookRes MiddlewareHookResponse
	err = dec.Decode(&hookRes)
	if err != nil {
		return nil, fmt.Errorf("error decoding function response: %w", err)
	}

	if hookRes.Error != "" {
		return nil, fmt.Errorf("error calling function %s: %s", operationName, hookRes.Error)
	}

	return &hookRes, nil
}

func (c *Client) DoFunctionSubscriptionRequest(ctx context.Context, operationName string, jsonData []byte, subscribeOnce, sse bool, out io.Writer) error {
	jsonData = c.setInternalHookData(ctx, jsonData)
	r, err := http.NewRequestWithContext(ctx, "POST", c.serverUrl+"/functions/"+operationName, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	r.Header.Set("Content-Type", "application/json")
	r.Header.Set(logging.RequestIDHeader, logging.RequestIDFromContext(ctx))
	if subscribeOnce {
		r.Header.Set("X-WG-Subscribe-Once", "true")
	}

	req, err := retryablehttp.FromRequest(r)
	if err != nil {
		return err
	}

	resp, err := c.subscriptionsClient.Do(req)
	if err != nil {
		return fmt.Errorf("error calling function %s: %w", operationName, err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server function call did not return 200: %s", resp.Status)
	}

	if resp.Body == nil {
		return fmt.Errorf("server function call did not return a body")
	}

	defer resp.Body.Close()

	flusher, ok := out.(http.Flusher)
	if !ok {
		return fmt.Errorf("client connection is not flushable")
	}

	buf := bufio.NewReader(resp.Body)
	var (
		line []byte
	)

	for {
		line, err = buf.ReadBytes('\n')
		if err == nil {
			_, err = buf.ReadByte()
		}
		if err != nil {
			if err == io.EOF {
				return nil
			}
			if ctx.Err() != nil {
				return nil
			}
			return err
		}
		if sse {
			_, err = out.Write([]byte("data: "))
			if err != nil {
				if ctx.Err() != nil {
					return nil
				}
				return fmt.Errorf("error writing to client: %w", err)
			}
		}
		_, err = out.Write(line)
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			return fmt.Errorf("error writing to client: %w", err)
		}
		// we only need to write one newline, the second one is already in the line above
		_, err = out.Write([]byte("\n"))
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			return fmt.Errorf("error writing to client: %w", err)
		}
		flusher.Flush()
	}
}

func (c *Client) DoAuthenticationRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "authentication", hook, jsonData)
}

func (c *Client) DoUploadRequest(ctx context.Context, providerName string, profileName string, hook UploadHook, jsonData []byte) (*UploadHookResponse, error) {
	var hookResponse UploadHookResponse
	if err := c.doRequest(ctx, &hookResponse, path.Join("upload", providerName, profileName), MiddlewareHook(hook), jsonData); err != nil {
		return nil, err
	}
	return &hookResponse, nil
}

func (c *Client) setInternalHookData(ctx context.Context, jsonData []byte) []byte {
	if len(jsonData) == 0 {
		jsonData = []byte(`{}`)
	}
	if clientRequest, ok := ctx.Value(pool.ClientRequestKey).(*http.Request); ok {
		_, wgClientRequestType, _, _ := jsonparser.Get(jsonData, "__wg", "clientRequest")
		if clientRequestData, err := HttpRequestToWunderGraphRequestJSON(clientRequest, false); err == nil && wgClientRequestType == jsonparser.NotExist {
			jsonData, _ = jsonparser.Set(jsonData, clientRequestData, "__wg", "clientRequest")
		}
	}
	return jsonData
}

func (c *Client) doRequest(ctx context.Context, hookResponse HookResponse, action string, hook MiddlewareHook, jsonData []byte) error {
	jsonData = c.setInternalHookData(ctx, jsonData)
	r, err := http.NewRequestWithContext(ctx, "POST", c.serverUrl+"/"+action+"/"+string(hook), bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	r.Header.Set("Content-Type", "application/json")
	r.Header.Set(logging.RequestIDHeader, logging.RequestIDFromContext(ctx))

	req, err := retryablehttp.FromRequest(r)
	if err != nil {
		return err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("hook %s failed with invalid status code: %d, cause: %w", string(hook), 500, err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("hook %s failed with invalid status code: %d", string(hook), resp.StatusCode)
	}

	dec := json.NewDecoder(resp.Body)

	err = dec.Decode(hookResponse)
	if err != nil {
		return fmt.Errorf("hook %s response could not be decoded: %w", string(hook), err)
	}

	if hookResponse.ResponseError() != "" {
		return fmt.Errorf("hook %s failed with error: %s", string(hook), hookResponse.ResponseError())
	}

	return nil
}

func (c *Client) doMiddlewareRequest(ctx context.Context, action string, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	var hookResponse MiddlewareHookResponse
	if err := c.doRequest(ctx, &hookResponse, action, hook, jsonData); err != nil {
		return nil, err
	}
	return &hookResponse, nil
}

func (c *Client) DoHealthCheckRequest(ctx context.Context) (status bool) {
	req, err := retryablehttp.NewRequestWithContext(ctx, "GET", c.serverUrl+"/health", nil)
	if err != nil {
		return false
	}
	resp, err := c.httpClient.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return
	}

	return true
}
