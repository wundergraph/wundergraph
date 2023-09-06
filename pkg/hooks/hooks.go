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
	"strconv"
	"strings"
	"time"

	"github.com/buger/jsonparser"
	"github.com/hashicorp/go-retryablehttp"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	otrace "go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/trace"
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
		r.Body = ioutil.NopCloser(bytes.NewReader(body))
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

type HookResponseError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"statusCode"`
	Stack      string `json:"stack"`
}

func (e *HookResponseError) Error() string {
	return e.Message
}

type HookResponse interface {
	HookName() string
	OperationName() string
	ResponseError() error
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
	Error                   *HookResponseError `json:"error,omitempty"`
	Op                      string             `json:"op"`
	Hook                    string             `json:"hook"`
	Response                json.RawMessage    `json:"response"`
	Input                   json.RawMessage    `json:"input"`
	SetClientRequestHeaders map[string]string  `json:"setClientRequestHeaders"`
	// ClientResponseStatusCode is the status code that should be returned to the client
	ClientResponseStatusCode int
}

func (r *MiddlewareHookResponse) OperationName() string {
	return r.Op
}

func (r *MiddlewareHookResponse) HookName() string {
	return r.Hook
}

func (r *MiddlewareHookResponse) ResponseError() error {
	// XXX: Don't simplify this unless you know what you're doing
	if r.Error != nil {
		return r.Error
	}
	return nil
}

type UploadHookResponse struct {
	Hook    string             `json:"hook"`
	Error   *HookResponseError `json:"error"`
	FileKey string             `json:"fileKey"`
}

func (r *UploadHookResponse) OperationName() string {
	return "upload"
}

func (r *UploadHookResponse) HookName() string {
	return r.Hook
}

func (r *UploadHookResponse) ResponseError() error {
	// XXX: Don't simplify this unless you know what you're doing
	if r.Error != nil {
		return r.Error
	}
	return nil
}

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
	HttpTransportOnResponse  MiddlewareHook = "onOriginResponse"
	HttpTransportOnTransport MiddlewareHook = "onOriginTransport"

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

type ClientOptions struct {
	ServerURL     string
	EnableTracing bool
	Logger        *zap.Logger
}

func NewClient(opts *ClientOptions) *Client {

	rt := http.DefaultTransport

	if opts.EnableTracing {
		rt = trace.NewTransport(rt,
			otelhttp.WithSpanOptions(otrace.WithAttributes(trace.HooksClientAttribute)),
		)
	}

	return &Client{
		serverUrl:           opts.ServerURL,
		httpClient:          buildClient(60*time.Second, rt),
		subscriptionsClient: buildClient(0, rt),
		log:                 opts.Logger,
	}
}

func buildClient(requestTimeout time.Duration, rt http.RoundTripper) *retryablehttp.Client {
	httpClient := retryablehttp.NewClient()
	httpClient.HTTPClient.Transport = rt
	// we will try 40 times with a constant delay of 50ms after max 2s we will give up
	httpClient.RetryMax = 40
	// keep it low and linear to increase the chance
	// that we can continue as soon as the server is back from a cold start
	httpClient.Backoff = retryablehttp.LinearJitterBackoff
	httpClient.RetryWaitMax = 50 * time.Millisecond
	httpClient.RetryWaitMin = 50 * time.Millisecond
	httpClient.HTTPClient.Timeout = requestTimeout
	httpClient.Logger = log.New(io.Discard, "", log.LstdFlags)
	httpClient.CheckRetry = func(ctx context.Context, resp *http.Response, err error) (bool, error) {
		if resp != nil && resp.StatusCode == http.StatusInternalServerError {
			return false, nil
		}
		return retryablehttp.DefaultRetryPolicy(ctx, resp, err)
	}
	return httpClient
}

func (c *Client) DoGlobalRequest(ctx context.Context, hook MiddlewareHook, hookID string, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "global/httpTransport", hook, hookID, jsonData, buf)
}

func (c *Client) DoWsTransportRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "global/wsTransport", hook, "", jsonData, buf)
}

func (c *Client) DoOperationRequest(ctx context.Context, operationName string, hook MiddlewareHook, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "operation/"+operationName, hook, "", jsonData, buf)
}

func (c *Client) DoFunctionRequest(ctx context.Context, operationName string, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	jsonData = c.setInternalHookData(ctx, jsonData, buf)
	r, err := http.NewRequestWithContext(ctx, "POST", c.serverUrl+"/functions/"+operationName, bytes.NewReader(jsonData))
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

	defer resp.Body.Close()

	dec := json.NewDecoder(resp.Body)

	var hookRes MiddlewareHookResponse
	err = dec.Decode(&hookRes)
	if err != nil {
		return nil, fmt.Errorf("error decoding function response: %w", err)
	}

	if err := hookRes.ResponseError(); err != nil {
		if err.Error() == "" {
			// Hook failed but didn't report a message
			return nil, fmt.Errorf("hook %s failed for operation %s", hookRes.HookName(), hookRes.OperationName())
		}

		return nil, err
	}

	hookRes.ClientResponseStatusCode = resp.StatusCode

	return &hookRes, nil
}

func (c *Client) DoFunctionSubscriptionRequest(ctx context.Context, operationName string, jsonData []byte, subscribeOnce bool, out io.Writer, buf *bytes.Buffer) error {
	jsonData = c.setInternalHookData(ctx, jsonData, buf)
	r, err := http.NewRequestWithContext(ctx, "POST", c.serverUrl+"/functions/"+operationName, bytes.NewReader(jsonData))
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
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server function call did not return an ok response: %s", resp.Status)
	}

	flusher, ok := out.(http.Flusher)
	if !ok {
		return fmt.Errorf("client connection is not flushable")
	}

	reader := bufio.NewReader(resp.Body)

	var (
		line []byte
	)

	for {
		line, err = reader.ReadBytes('\n')
		if err == nil {
			// Read the next line separator
			var b byte
			b, err = reader.ReadByte()
			if err == io.EOF {
				err = nil
			}
			if b != '\n' {
				return fmt.Errorf("invalid chunk separator %s", string(b))
			}
		}
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
		// Skip the \n terminator
		_, err = out.Write(line[:len(line)-1])
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			return fmt.Errorf("error writing to client: %w", err)
		}
		flusher.Flush()
	}
}

func (c *Client) DoAuthenticationRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "authentication", hook, "", jsonData, buf)
}

func (c *Client) DoUploadRequest(ctx context.Context, providerName string, profileName string, hook UploadHook, jsonData []byte, buf *bytes.Buffer) (*UploadHookResponse, error) {
	var hookResponse UploadHookResponse
	if err := c.doRequest(ctx, &hookResponse, path.Join("upload", providerName, profileName), MiddlewareHook(hook), "", jsonData, buf); err != nil {
		return nil, err
	}
	return &hookResponse, nil
}

func (c *Client) setInternalHookData(ctx context.Context, jsonData []byte, buf *bytes.Buffer) []byte {
	if len(jsonData) == 0 {
		jsonData = []byte(`{}`)
	}
	// Make sure we account for both pool.ClientRequestKey being nil and being non present
	if clientRequest, ok := ctx.Value(pool.ClientRequestKey).(*http.Request); ok && clientRequest != nil {
		_, wgClientRequestType, _, _ := jsonparser.Get(jsonData, "__wg", "clientRequest")
		if clientRequestData, err := HttpRequestToWunderGraphRequestJSON(clientRequest, false); err == nil && wgClientRequestType == jsonparser.NotExist {
			buf.Reset()
			_, _ = buf.Write(jsonData)
			// because we modify the original json data, we need to make sure that the original data is not modified
			// so we copy it first with enough space to append the clientRequestData
			jsonData, _ = jsonparser.Set(buf.Bytes(), clientRequestData, "__wg", "clientRequest")
		}
	}
	return jsonData
}

func (c *Client) doRequest(ctx context.Context, hookResponse HookResponse, action string, hook MiddlewareHook, hookID string, jsonData []byte, buf *bytes.Buffer) error {
	jsonData = c.setInternalHookData(ctx, jsonData, buf)
	hookURL := c.serverUrl + "/" + action + "/" + string(hook)
	if hookID != "" {
		hookURL += "/" + hookID
	}
	r, err := http.NewRequestWithContext(ctx, "POST", hookURL, bytes.NewReader(jsonData))
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
		return fmt.Errorf("hook %s failed with error: %w", string(hook), err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("hook %s failed with reading body with error: %w", string(hook), err)
	}

	// Decode the hook response first, since we might want to propagate the error message
	if err := json.Unmarshal(data, hookResponse); err != nil {
		return fmt.Errorf("hook %s response could not be decoded: %w", string(hook), err)
	}

	if err := hookResponse.ResponseError(); err != nil {
		if err.Error() == "" {
			// Hook failed but didn't report a message
			return fmt.Errorf("hook %s failed for operation %s", hookResponse.HookName(), hookResponse.OperationName())
		}
		return err
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("hook %s failed with invalid status code: %d (%s)", string(hook), resp.StatusCode, string(data))
	}

	return nil
}

func (c *Client) doMiddlewareRequest(ctx context.Context, action string, hook MiddlewareHook, hookID string, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	var hookResponse MiddlewareHookResponse
	if err := c.doRequest(ctx, &hookResponse, action, hook, hookID, jsonData, buf); err != nil {
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
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

func encodeData(r *http.Request, w *bytes.Buffer, variables []byte, response []byte) ([]byte, error) {
	const (
		wgKey = "__wg"
		root  = `{"` + wgKey + `":{}}`
	)
	var err error
	buf := w.Bytes()[0:]
	buf = append(buf, []byte(root)...)

	if user := authentication.UserFromContext(r.Context()); user != nil {
		userJson, err := json.Marshal(user)
		if err != nil {
			return nil, err
		}
		if buf, err = jsonparser.Set(buf, userJson, wgKey, "user"); err != nil {
			return nil, err
		}
	}
	if len(variables) > 2 {
		if buf, err = jsonparser.Set(buf, variables, "input"); err != nil {
			return nil, err
		}
	}
	if len(response) != 0 {
		if buf, err = jsonparser.Set(buf, response, "response"); err != nil {
			return nil, err
		}
	}
	if r != nil {
		counterHeader := r.Header.Get("Wg-Cycle-Counter")
		counter, _ := strconv.ParseInt(counterHeader, 10, 64)
		counterValue := []byte(strconv.FormatInt(counter+1, 10))
		if buf, err = jsonparser.Set(buf, counterValue, "cycleCounter"); err != nil {
			return nil, err
		}
	}
	// If buf required more bytes than what w provided, copy buf into w so next time w's backing slice has enough
	// room to fit the whole payload
	if cap(buf) > w.Cap() {
		_, _ = w.Write(buf)
	}
	return buf, nil
}

// EncodeData encodes the given input data for a hook as a JSON payload to be sent to the hooks server
func EncodeData(r *http.Request, buf *bytes.Buffer, variables []byte, response []byte) ([]byte, error) {
	data, err := encodeData(r, buf, variables, response)
	if err != nil {
		return nil, fmt.Errorf("encoding hook data: %w", err)
	}
	return data, nil
}
