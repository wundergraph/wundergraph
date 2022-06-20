package hooks

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/hashicorp/go-retryablehttp"
)

type MiddlewareHookResponse struct {
	Error                   string            `json:"error,omitempty"`
	Op                      string            `json:"op"`
	Hook                    string            `json:"hook"`
	Response                json.RawMessage   `json:"response"`
	Input                   json.RawMessage   `json:"input"`
	SetClientRequestHeaders map[string]string `json:"setClientRequestHeaders"`
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
	MutatingPostAuthentication MiddlewareHook = "mutatingPostAuthentication"
	RevalidateAuthentication   MiddlewareHook = "revalidateAuthentication"

	// HttpTransportOnRequest to the origin
	HttpTransportOnRequest MiddlewareHook = "onOriginRequest"
	// HttpTransportOnResponse from the origin
	HttpTransportOnResponse MiddlewareHook = "onOriginResponse"
)

type Client struct {
	serverUrl  string
	httpClient *retryablehttp.Client
}

func NewClient(serverUrl string) *Client {
	httpClient := retryablehttp.NewClient()
	httpClient.RetryMax = 5
	httpClient.HTTPClient.Timeout = time.Minute * 1
	return &Client{
		serverUrl:  serverUrl,
		httpClient: httpClient,
	}
}

func (c *Client) DoGlobalRequest(clientRequest *http.Request, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doRequest(clientRequest, "global/httpTransport", hook, jsonData)
}

func (c *Client) DoOperationRequest(clientRequest *http.Request, operationName string, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doRequest(clientRequest, "operation/"+operationName, hook, jsonData)
}

func (c *Client) DoAuthenticationRequest(clientRequest *http.Request, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doRequest(clientRequest, "authentication", hook, jsonData)
}

func (c *Client) setInternalHookData(clientRequest *http.Request, jsonData []byte) []byte {
	return jsonData
}

func (c *Client) doRequest(clientRequest *http.Request, action string, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	jsonData = c.setInternalHookData(clientRequest, jsonData)
	r, err := http.NewRequest("POST", c.serverUrl+"/"+action+"/"+string(hook), bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	r.Header.Set("Content-Type", "application/json")
	req, err := retryablehttp.FromRequest(r)
	if err != nil {
		return nil, err
	}
	req.WithContext(clientRequest.Context())
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("middleware hook %s failed with invalid status code: %d", string(hook), resp.StatusCode)
	}

	dec := json.NewDecoder(resp.Body)

	var hookRes MiddlewareHookResponse
	err = dec.Decode(&hookRes)
	if err != nil {
		return nil, fmt.Errorf("response of middleware hook %s could not be decoded: %w", string(hook), err)
	}
	if hookRes.Error != "" {
		return nil, fmt.Errorf("middleware hook %s failed with error: %s", string(hook), hookRes.Error)
	}

	return &hookRes, nil
}
