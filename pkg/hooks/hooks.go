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
	"github.com/mattbaird/jsonpatch"
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
	// ClientResponseStatusCode is the status code that should be returned to the client
	ClientResponseStatusCode int
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
	httpClient.CheckRetry = func(ctx context.Context, resp *http.Response, err error) (bool, error) {
		if resp != nil && resp.StatusCode == http.StatusInternalServerError {
			return false, nil
		}
		return retryablehttp.DefaultRetryPolicy(ctx, resp, err)
	}
	return httpClient
}

func (c *Client) DoGlobalRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "global/httpTransport", hook, jsonData, buf)
}

func (c *Client) DoWsTransportRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "global/wsTransport", hook, jsonData, buf)
}

func (c *Client) DoOperationRequest(ctx context.Context, operationName string, hook MiddlewareHook, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "operation/"+operationName, hook, jsonData, buf)
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

	if resp == nil {
		return nil, fmt.Errorf("error calling function %s: no response", operationName)
	}

	switch resp.StatusCode {
	case http.StatusOK, http.StatusInternalServerError, http.StatusUnauthorized:
		break
	default:
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

	switch resp.StatusCode {
	case http.StatusInternalServerError:
		hookRes.ClientResponseStatusCode = http.StatusBadGateway
	case http.StatusUnauthorized:
		hookRes.ClientResponseStatusCode = http.StatusUnauthorized
	default:
		hookRes.ClientResponseStatusCode = http.StatusOK
	}

	return &hookRes, nil
}

func (c *Client) DoFunctionSubscriptionRequest(ctx context.Context, operationName string, jsonData []byte, subscribeOnce, useSSE, useJsonPatch bool, out io.Writer, buf *bytes.Buffer) error {
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

	if useSSE {
		defer func() {
			_, _ = out.Write([]byte("data: done\n\n"))
			flusher.Flush()
		}()
	}

	reader := bufio.NewReader(resp.Body)
	lastLine := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(lastLine)

	var (
		line []byte
	)

	for {
		line, err = reader.ReadBytes('\n')
		if err == nil {
			_, err = reader.ReadByte()
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
		if useSSE {
			_, err = out.Write([]byte("data: "))
			if err != nil {
				if ctx.Err() != nil {
					return nil
				}
				return fmt.Errorf("error writing to client: %w", err)
			}
		}
		if useJsonPatch && lastLine.Len() != 0 {
			patchOperation, err := jsonpatch.CreatePatch(lastLine.Bytes(), line[:len(line)-1]) // remove newline
			if err != nil {
				return fmt.Errorf("error creating json patch: %w", err)
			}
			patch, err := json.Marshal(patchOperation)
			if err != nil {
				return fmt.Errorf("error marshalling json patch: %w", err)
			}
			if len(patch) < len(line) {
				_, err = out.Write(patch)
				if err != nil {
					return err
				}
				_, err = out.Write([]byte("\n")) // add newline again
				if err != nil {
					return err
				}
			} else {
				_, err = out.Write(line)
				if err != nil {
					return err
				}
			}
		} else {
			_, err = out.Write(line)
		}
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
		lastLine.Reset()
		_, _ = lastLine.Write(line)
	}
}

func (c *Client) DoAuthenticationRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	return c.doMiddlewareRequest(ctx, "authentication", hook, jsonData, buf)
}

func (c *Client) DoUploadRequest(ctx context.Context, providerName string, profileName string, hook UploadHook, jsonData []byte, buf *bytes.Buffer) (*UploadHookResponse, error) {
	var hookResponse UploadHookResponse
	if err := c.doRequest(ctx, &hookResponse, path.Join("upload", providerName, profileName), MiddlewareHook(hook), jsonData, buf); err != nil {
		return nil, err
	}
	return &hookResponse, nil
}

func (c *Client) setInternalHookData(ctx context.Context, jsonData []byte, buf *bytes.Buffer) []byte {
	if len(jsonData) == 0 {
		jsonData = []byte(`{}`)
	}
	if clientRequest, ok := ctx.Value(pool.ClientRequestKey).(*http.Request); ok {
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

func (c *Client) doRequest(ctx context.Context, hookResponse HookResponse, action string, hook MiddlewareHook, jsonData []byte, buf *bytes.Buffer) error {
	jsonData = c.setInternalHookData(ctx, jsonData, buf)
	r, err := http.NewRequestWithContext(ctx, "POST", c.serverUrl+"/"+action+"/"+string(hook), bytes.NewReader(jsonData))
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

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("hook %s failed with invalid status code: %d (%s)", string(hook), resp.StatusCode, string(data))
	}

	err = json.Unmarshal(data, hookResponse)
	if err != nil {
		return fmt.Errorf("hook %s response could not be decoded: %w", string(hook), err)
	}

	if hookResponse.ResponseError() != "" {
		return fmt.Errorf("hook %s failed with error: %s", string(hook), hookResponse.ResponseError())
	}

	return nil
}

func (c *Client) doMiddlewareRequest(ctx context.Context, action string, hook MiddlewareHook, jsonData []byte, buf *bytes.Buffer) (*MiddlewareHookResponse, error) {
	var hookResponse MiddlewareHookResponse
	if err := c.doRequest(ctx, &hookResponse, action, hook, jsonData, buf); err != nil {
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

func EncodeData(authenticator Authenticator, r *http.Request, buf []byte, variables []byte, response []byte) []byte {
	// TODO: This doesn't really reuse the bytes.Buffer storage, refactor it after adding more tests
	buf = buf[:0]
	buf = append(buf, []byte(`{"__wg":{}}`)...)
	if user := authenticator(r.Context()); user != nil {
		if userJson, err := json.Marshal(user); err == nil {
			buf, _ = jsonparser.Set(buf, userJson, "__wg", "user")
		}
	}
	if len(variables) > 2 {
		buf, _ = jsonparser.Set(buf, variables, "input")
	}
	if len(response) != 0 {
		buf, _ = jsonparser.Set(buf, response, "response")
	}
	if r != nil {
		counterHeader := r.Header.Get("Wg-Cycle-Counter")
		counter, _ := strconv.ParseInt(counterHeader, 10, 64)
		counterValue := []byte(strconv.FormatInt(counter+1, 10))
		buf, _ = jsonparser.Set(buf, counterValue, "cycleCounter")
	}
	return buf
}
