package apihandler

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/buger/jsonparser"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/websocket"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	otrace "go.opentelemetry.io/otel/trace"

	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/metrics"
	"github.com/wundergraph/wundergraph/pkg/operation"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/trace"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type ApiTransportFactory interface {
	RoundTripper(transport *http.Transport, enableStreamingMode bool) http.RoundTripper
	DefaultTransportTimeout() time.Duration
	DefaultHTTPProxyURL() *url.URL
}

type apiTransportFactory struct {
	opts ApiTransportOptions
}

func (f *apiTransportFactory) RoundTripper(transport *http.Transport, enableStreamingMode bool) http.RoundTripper {
	rt := NewApiTransport(transport, enableStreamingMode, f.opts)

	if f.opts.EnableTracing {
		return trace.NewTransport(
			rt,
			otelhttp.WithSpanOptions(otrace.WithAttributes(trace.ApiTransportAttribute)),
		)
	}

	return rt
}

func (f *apiTransportFactory) DefaultTransportTimeout() time.Duration {
	return f.opts.API.Options.DefaultTimeout
}

func (f *apiTransportFactory) DefaultHTTPProxyURL() *url.URL {
	return f.opts.API.Options.DefaultHTTPProxyURL
}

type operationTransportHooks struct {
	OnRequest   bool
	OnResponse  bool
	OnTransport bool
}

type ApiTransport struct {
	httpTransport              *http.Transport
	api                        *Api
	enableRequestLogging       bool
	upstreamAuthConfigurations map[string]*wgpb.UpstreamAuthentication
	operationHooks             map[string]operationTransportHooks
	hooksClient                *hooks.Client
	enableStreamingMode        bool
	requestCounter             *outgoingRequestCounter
}

func NewApiTransportFactory(opts ApiTransportOptions) ApiTransportFactory {
	return &apiTransportFactory{
		opts: opts,
	}
}

type ApiTransportOptions struct {
	API                  *Api
	HooksClient          *hooks.Client
	EnableRequestLogging bool
	EnableTracing        bool
	Metrics              metrics.Metrics
}

func NewApiTransport(httpTransport *http.Transport, enableStreamingMode bool, opts ApiTransportOptions) http.RoundTripper {

	transport := &ApiTransport{
		httpTransport:              httpTransport,
		enableRequestLogging:       opts.EnableRequestLogging,
		api:                        opts.API,
		upstreamAuthConfigurations: map[string]*wgpb.UpstreamAuthentication{},
		operationHooks:             make(map[string]operationTransportHooks),
		hooksClient:                opts.HooksClient,
		enableStreamingMode:        enableStreamingMode,
		requestCounter:             newOutgoingRequestCounter(opts.Metrics),
	}

	if dataSourceConfigurations := opts.API.EngineConfiguration.GetDatasourceConfigurations(); dataSourceConfigurations != nil {
		for _, configuration := range dataSourceConfigurations {
			switch configuration.Kind {
			case wgpb.DataSourceKind_GRAPHQL:
				if configuration.CustomGraphql != nil && configuration.CustomGraphql.Fetch != nil && configuration.CustomGraphql.Fetch.UpstreamAuthentication != nil {
					parsed, err := url.Parse(loadvariable.String(configuration.CustomGraphql.Fetch.Url))
					if err != nil {
						continue
					}
					transport.upstreamAuthConfigurations[parsed.Host] = configuration.CustomGraphql.Fetch.UpstreamAuthentication
				}
			case wgpb.DataSourceKind_REST:
				if configuration.CustomRest != nil && configuration.CustomRest.Fetch != nil && configuration.CustomRest.Fetch.UpstreamAuthentication != nil {
					parsed, err := url.Parse(loadvariable.String(configuration.CustomRest.Fetch.Url))
					if err != nil {
						continue
					}
					transport.upstreamAuthConfigurations[parsed.Host] = configuration.CustomRest.Fetch.UpstreamAuthentication
				}
			}
		}
	}

	for _, op := range opts.API.Operations {
		operationHooks := operationTransportHooks{
			OnRequest:   op.HooksConfiguration.HttpTransportOnRequest,
			OnResponse:  op.HooksConfiguration.HttpTransportOnResponse,
			OnTransport: op.HooksConfiguration.HttpTransportOnTransport,
		}
		transport.operationHooks[op.Name] = operationHooks
	}

	return transport
}

type Claims struct {
	Name string `json:"name"`
	jwt.StandardClaims
}

func (t *ApiTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	request.Header.Set(logging.RequestIDHeader, logging.RequestIDFromContext(request.Context()))

	if request.Header.Get(WgInternalApiCallHeader) == "true" {
		return t.internalGraphQLRoundTrip(request)
	}

	upstreamAuth, ok := t.upstreamAuthConfigurations[request.Host]
	if ok {
		err := t.handleUpstreamAuthentication(request, upstreamAuth)
		if err != nil {
			return nil, err
		}
	}

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	return t.roundTrip(request, buf)
}

func (t *ApiTransport) roundTrip(request *http.Request, buf *bytes.Buffer) (res *http.Response, err error) {

	var operationHooks operationTransportHooks

	// this evaluation needs to happen on the original request
	// if you're doing this after calling the onRequest hook, it won't work
	isUpgradeRequest := websocket.IsWebSocketUpgrade(request)

	metaData := operation.GetOperationMetaData(request.Context())
	if metaData != nil {
		operationHooks = t.operationHooks[metaData.OperationName]
	}

	if operationHooks.OnRequest {
		request, err = t.handleOnRequestHook(request, metaData, buf)
		if err != nil {
			return nil, err
		}
	}

	var requestDump []byte

	if t.enableRequestLogging {
		requestDump, err = httputil.DumpRequest(request, true)
		if err != nil {
			return nil, fmt.Errorf("httputil.DumpRequest failed: %w", err)
		}
	}

	// adjust request.Host before roundtrip
	setRequestHost(request)

	start := time.Now()
	if operationHooks.OnTransport {
		res, err = t.handleOnTransportHook(request, metaData, buf)
		if err == nil && res == nil {
			// Hook skipped the fetch
			res, err = t.httpTransport.RoundTrip(request)
		}
	} else {
		res, err = t.httpTransport.RoundTrip(request)
	}
	duration := time.Since(start)
	if err != nil {
		return nil, err
	}

	// in case of http Upgrade requests, we must not dump the response
	// otherwise, the upgrade will fail
	if isUpgradeRequest || t.enableStreamingMode {
		if t.enableRequestLogging {
			fmt.Printf("\n\n--- DebugTransport ---\n\nRequest:\n\n%s\n\nDuration: %d ms\n\n--- DebugTransport\n\n",
				string(requestDump),
				duration.Milliseconds(),
			)
		}
		return
	}

	t.requestCounter.Inc(request, res, duration)

	if t.enableRequestLogging {
		var responseDump []byte
		err = request.Context().Err()
		if err != nil {
			responseDump = []byte(err.Error())
		} else if res != nil {
			responseDump, _ = httputil.DumpResponse(res, true)
		} else {
			responseDump = []byte("<no response>")
		}

		fmt.Printf("\n\n--- DebugTransport ---\n\nRequest:\n\n%s\n\nDuration: %d ms\n\nResponse:\n\n%s\n\n--- DebugTransport\n\n",
			string(requestDump),
			duration,
			string(responseDump),
		)
	}

	if operationHooks.OnResponse {
		return t.handleOnResponseHook(res, metaData, buf)
	}

	return
}

// internalGraphQLRoundTrip is used to call the graphql-js servers, "embedded" into the fastify hook server
// using this transport, we're able to inject the user and original request as __wg body variables
// these get extracted by the fastify server
// so that the graphql-js context has access to the original user and request
func (t *ApiTransport) internalGraphQLRoundTrip(request *http.Request) (res *http.Response, err error) {
	request.Header.Del(WgInternalApiCallHeader)
	user := authentication.UserFromContext(request.Context())

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	_, err = buf.ReadFrom(request.Body)
	if err != nil {
		return nil, err
	}

	requestBody := buf.Bytes()

	requestBody, err = jsonparser.Set(requestBody, []byte("{}"), "__wg")
	if err != nil {
		return nil, err
	}

	if user != nil {
		userData, err := json.Marshal(*user)
		if err != nil {
			return nil, err
		}
		requestBody, err = jsonparser.Set(requestBody, userData, "__wg", "user")
		if err != nil {
			return nil, err
		}
	}
	// Make sure we account for both pool.ClientRequestKey being nil and being non present
	if clientRequest, ok := request.Context().Value(pool.ClientRequestKey).(*http.Request); ok && clientRequest != nil {
		requestJSON, err := hooks.HttpRequestToWunderGraphRequestJSON(clientRequest, false)
		if err != nil {
			return nil, err
		}
		requestBody, err = jsonparser.Set(requestBody, requestJSON, "__wg", "clientRequest")
		if err != nil {
			return nil, err
		}
	}

	req, err := http.NewRequestWithContext(request.Context(), request.Method, request.URL.String(), io.NopCloser(bytes.NewReader(requestBody)))
	if err != nil {
		return nil, err
	}

	req.Header = request.Header.Clone()
	setRequestHost(req)

	return t.httpTransport.RoundTrip(req)
}

func (t *ApiTransport) sendRequestHook(r *http.Request, metaData *operation.OperationMetaData, buf *bytes.Buffer, hook hooks.MiddlewareHook, result interface{}) error {
	var (
		body []byte
		err  error
	)
	if r.Body != nil {
		body, err = io.ReadAll(r.Body)
		if err != nil {
			return err
		}
		r.Body = io.NopCloser(bytes.NewBuffer(body))
	}
	payload := hooks.OnRequestHookPayload{
		Request: hooks.WunderGraphRequest{
			Method:     r.Method,
			RequestURI: r.URL.String(),
			Headers:    hooks.HeaderSliceToCSV(r.Header),
			Body:       body,
		},
		OperationName: metaData.OperationName,
		OperationType: metaData.GetOperationTypeString(),
	}
	hookData, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	if user := authentication.UserFromContext(r.Context()); user != nil {
		if userJson, err := json.Marshal(user); err == nil {
			hookData, _ = jsonparser.Set(hookData, userJson, "__wg", "user")
		}
	}

	out, err := t.hooksClient.DoGlobalRequest(r.Context(), hook, hookData, buf)
	if err != nil {
		return err
	}
	return json.Unmarshal(out.Response, &result)
}

func (t *ApiTransport) handleOnRequestHook(r *http.Request, metaData *operation.OperationMetaData, buf *bytes.Buffer) (*http.Request, error) {
	var response hooks.OnRequestHookResponse
	if err := t.sendRequestHook(r, metaData, buf, hooks.HttpTransportOnRequest, &response); err != nil {
		return nil, err
	}
	if response.Skip {
		return r, nil
	}
	if response.Cancel {
		return nil, errors.New("canceled")
	}
	if response.Request != nil {
		req, err := http.NewRequestWithContext(r.Context(), response.Request.Method, response.Request.RequestURI, bytes.NewReader(response.Request.Body))
		if err != nil {
			return nil, err
		}
		req.Header = hooks.HeaderCSVToSlice(response.Request.Headers)
		return req, nil
	}
	return r, nil
}

func (t *ApiTransport) decodeOnResponseHookResponse(resp *http.Response, hookResponse *hooks.OnResponseHookResponse) (*http.Response, error) {
	if hookResponse.Skip {
		return resp, nil
	}
	if hookResponse.Cancel {
		return nil, errors.New("canceled")
	}
	if hookResponse.Response != nil {
		statusCode := hookResponse.Response.StatusCode
		proto := "HTTP/1.1"
		protoMajor := 1
		protoMinor := 1
		var trailer http.Header
		if resp != nil {
			proto = resp.Proto
			protoMajor = resp.ProtoMajor
			protoMinor = resp.ProtoMinor
			trailer = resp.Trailer
		}
		return &http.Response{
			Status:           http.StatusText(statusCode),
			StatusCode:       statusCode,
			Proto:            proto,
			ProtoMajor:       protoMajor,
			ProtoMinor:       protoMinor,
			Header:           hooks.HeaderCSVToSlice(hookResponse.Response.Headers),
			Body:             io.NopCloser(bytes.NewReader(hookResponse.Response.Body)),
			ContentLength:    int64(len(hookResponse.Response.Body)),
			TransferEncoding: nil,
			Close:            true,
			// the server, set Transport.DisableCompression to true.
			Uncompressed: false,

			Trailer: trailer,

			Request: nil,
			TLS:     nil,
		}, nil
	}
	return resp, nil
}

func (t *ApiTransport) handleOnResponseHook(resp *http.Response, metaData *operation.OperationMetaData, buf *bytes.Buffer) (*http.Response, error) {
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	resp.Body = io.NopCloser(bytes.NewBuffer(body))
	payload := hooks.OnResponseHookPayload{
		Response: hooks.WunderGraphResponse{
			Method:     resp.Request.Method,
			RequestURI: resp.Request.URL.String(),
			Headers:    hooks.HeaderSliceToCSV(resp.Header),
			Body:       body,
			StatusCode: resp.StatusCode,
			Status:     resp.Status,
		},
		OperationName: metaData.OperationName,
		OperationType: metaData.GetOperationTypeString(),
	}
	hookData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	if user := authentication.UserFromContext(resp.Request.Context()); user != nil {
		if userJson, err := json.Marshal(user); err == nil {
			hookData, _ = jsonparser.Set(hookData, userJson, "__wg", "user")
		}
	}

	result, err := t.hooksClient.DoGlobalRequest(resp.Request.Context(), hooks.HttpTransportOnResponse, hookData, buf)
	if err != nil {
		return nil, err
	}

	var hookResponse hooks.OnResponseHookResponse
	if err := json.Unmarshal(result.Response, &hookResponse); err != nil {
		return nil, err
	}

	newResp, err := t.decodeOnResponseHookResponse(resp, &hookResponse)
	if err != nil {
		return nil, err
	}
	newResp.Request = resp.Request
	return newResp, nil
}

func (t *ApiTransport) handleOnTransportHook(r *http.Request, metaData *operation.OperationMetaData, buf *bytes.Buffer) (*http.Response, error) {
	var hookResponse hooks.OnResponseHookResponse
	if err := t.sendRequestHook(r, metaData, buf, hooks.HttpTransportOnTransport, &hookResponse); err != nil {
		return nil, err
	}
	return t.decodeOnResponseHookResponse(nil, &hookResponse)
}

func (t *ApiTransport) handleUpstreamAuthentication(request *http.Request, auth *wgpb.UpstreamAuthentication) error {

	user := authentication.UserFromContext(request.Context())
	if user == nil {
		return nil
	}

	switch auth.Kind {
	case wgpb.UpstreamAuthenticationKind_UpstreamAuthenticationJWT:

		claims := &Claims{
			Name: user.Name,
			StandardClaims: jwt.StandardClaims{
				ExpiresAt: time.Now().Add(time.Minute * 15).Unix(),
				Issuer:    t.api.PrimaryHost,
				Subject:   user.Email,
				Audience:  request.Host,
			},
		}

		if claims.Name == "" {
			claims.Name = user.NickName
		}

		var method jwt.SigningMethod
		switch auth.JwtConfig.SigningMethod {
		case wgpb.SigningMethod_SigningMethodHS256:
			method = jwt.SigningMethodHS256
		default:
			method = jwt.SigningMethodHS256
		}

		token := jwt.NewWithClaims(method, claims)
		ss, err := token.SignedString([]byte(loadvariable.String(auth.JwtConfig.Secret)))
		if err != nil {
			return err
		}
		request.Header.Set("Authorization", fmt.Sprintf("Bearer %s", ss))

	case wgpb.UpstreamAuthenticationKind_UpstreamAuthenticationJWTWithAccessTokenExchange:
		return fmt.Errorf("not implemented")
	}
	return nil
}

// setRequestHost - sets the request.Host to a value of the Host header if it is set
func setRequestHost(request *http.Request) {
	// in order to provide different host value we have to set it on the request.Host field
	// https://pkg.go.dev/net/http#Request

	if host := request.Header.Get("Host"); host != "" {
		request.Host = host
	}
}
