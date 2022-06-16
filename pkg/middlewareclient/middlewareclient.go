package middlewareclient

import (
	"bytes"
	"context"
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
	SetClientRequestHeaders map[string]string `json:"SetClientRequestHeaders"`
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

type MiddlewareClient struct {
	serverUrl  string
	httpClient *retryablehttp.Client
}

func NewMiddlewareClient(serverUrl string) *MiddlewareClient {
	httpClient := retryablehttp.NewClient()
	httpClient.RetryMax = 5
	httpClient.HTTPClient.Timeout = time.Minute * 1
	return &MiddlewareClient{
		serverUrl:  serverUrl,
		httpClient: httpClient,
	}
}

func (c *MiddlewareClient) DoGlobalRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doRequest(ctx, "global/httpTransport", hook, jsonData)
}

func (c *MiddlewareClient) DoOperationRequest(ctx context.Context, operationName string, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doRequest(ctx, "operation/"+operationName, hook, jsonData)
}

func (c *MiddlewareClient) DoAuthenticationRequest(ctx context.Context, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	return c.doRequest(ctx, "authentication", hook, jsonData)
}

func (c *MiddlewareClient) doRequest(ctx context.Context, action string, hook MiddlewareHook, jsonData []byte) (*MiddlewareHookResponse, error) {
	r, err := http.NewRequest("POST", c.serverUrl+"/"+action+"/"+string(hook), bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	r.Header.Set("Content-Type", "application/json")
	req, err := retryablehttp.FromRequest(r)
	if err != nil {
		return nil, err
	}
	req.WithContext(ctx)
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
