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

	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/telemetry/otel/trace"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type ApiTransportFactory interface {
	RoundTripper(tripper http.RoundTripper, enableStreamingMode bool) http.RoundTripper
	DefaultTransportTimeout() time.Duration
}

type apiTransportFactory struct {
	api                  *Api
	hooksClient          *hooks.Client
	enableRequestLogging bool
	tracerProvider       *trace.TracerProvider
}

func (f *apiTransportFactory) RoundTripper(tripper http.RoundTripper, enableStreamingMode bool) http.RoundTripper {
	return NewApiTransport(tripper, f.api, f.hooksClient, f.enableRequestLogging, enableStreamingMode, f.tracerProvider)
}

func (f *apiTransportFactory) DefaultTransportTimeout() time.Duration {
	return f.api.Options.DefaultTimeout
}

type ApiTransport struct {
	roundTripper               http.RoundTripper
	api                        *Api
	enableRequestLogging       bool
	upstreamAuthConfigurations map[string]*wgpb.UpstreamAuthentication
	onRequestHook              map[string]struct{}
	onResponseHook             map[string]struct{}
	hooksClient                *hooks.Client
	enableStreamingMode        bool
}

func NewApiTransportFactory(api *Api, hooksClient *hooks.Client, enableRequestLogging bool, tracerProvider *trace.TracerProvider) ApiTransportFactory {
	return &apiTransportFactory{
		api:                  api,
		hooksClient:          hooksClient,
		enableRequestLogging: enableRequestLogging,
		tracerProvider:       tracerProvider,
	}
}

func NewApiTransport(tripper http.RoundTripper, api *Api, hooksClient *hooks.Client, enableRequestLogging bool, enableStreamingMode bool, tp *trace.TracerProvider) http.RoundTripper {
	transport := &ApiTransport{
		roundTripper:               tripper,
		enableRequestLogging:       enableRequestLogging,
		api:                        api,
		upstreamAuthConfigurations: map[string]*wgpb.UpstreamAuthentication{},
		onResponseHook:             map[string]struct{}{},
		onRequestHook:              map[string]struct{}{},
		hooksClient:                hooksClient,
		enableStreamingMode:        enableStreamingMode,
	}

	if api.EngineConfiguration != nil && api.EngineConfiguration.DatasourceConfigurations != nil {
		for _, configuration := range api.EngineConfiguration.DatasourceConfigurations {
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

	for i := range api.Operations {
		name := api.Operations[i].Name
		if api.Operations[i].HooksConfiguration.HttpTransportOnRequest {
			transport.onRequestHook[name] = struct{}{}
		}
		if api.Operations[i].HooksConfiguration.HttpTransportOnResponse {
			transport.onResponseHook[name] = struct{}{}
		}
	}

	return trace.HTTPClientTransporter(transport, tp.Provider)
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
	var (
		onRequestHook, onResponseHook bool
	)

	// this evaluation needs to happen on the original request
	// if you're doing this after calling the onRequest hook, it won't work
	isUpgradeRequest := websocket.IsWebSocketUpgrade(request)

	metaData := getOperationMetaData(request)
	if metaData != nil {
		_, onRequestHook = t.onRequestHook[metaData.OperationName]
		_, onResponseHook = t.onResponseHook[metaData.OperationName]
	}

	if onRequestHook {
		request, err = t.handleOnRequestHook(request, metaData, buf)
		if err != nil {
			return nil, err
		}
	}

	// if we handle on request hook, the headers keys become lower case
	// we need to set the upgrade headers again
	// because in some weird cases the origin websocket request upgrade check could be case sensitive
	// as a result, the upgrade would fail
	if isUpgradeRequest {
		request.Header.Set("Connection", "upgrade")
		request.Header.Set("Upgrade", "websocket")
	}

	var requestDump []byte

	if t.enableRequestLogging {
		requestDump, _ = httputil.DumpRequest(request, true)
	}

	start := time.Now()
	res, err = t.roundTripper.RoundTrip(request)
	duration := time.Since(start).Milliseconds()
	if err != nil {
		return nil, err
	}

	// in case of http Upgrade requests, we must not dump the response
	// otherwise, the upgrade will fail
	if isUpgradeRequest || t.enableStreamingMode {
		if t.enableRequestLogging {
			fmt.Printf("\n\n--- DebugTransport ---\n\nRequest:\n\n%s\n\nDuration: %d ms\n\n--- DebugTransport\n\n",
				string(requestDump),
				duration,
			)
		}
		return
	}

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

	if onResponseHook {
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

	return t.roundTripper.RoundTrip(req)
}

func (t *ApiTransport) handleOnRequestHook(r *http.Request, metaData *OperationMetaData, buf *bytes.Buffer) (*http.Request, error) {
	var (
		body []byte
		err  error
	)
	if r.Body != nil {
		body, err = io.ReadAll(r.Body)
		if err != nil {
			return nil, err
		}
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
		return nil, err
	}
	if user := authentication.UserFromContext(r.Context()); user != nil {
		if userJson, err := json.Marshal(user); err == nil {
			hookData, _ = jsonparser.Set(hookData, userJson, "__wg", "user")
		}
	}

	out, err := t.hooksClient.DoGlobalRequest(r.Context(), hooks.HttpTransportOnRequest, hookData, buf)
	if err != nil {
		return nil, err
	}

	var response hooks.OnRequestHookResponse
	err = json.Unmarshal(out.Response, &response)
	if err != nil {
		return nil, err
	}
	if response.Skip {
		r.Body = io.NopCloser(bytes.NewBuffer(body))
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

func (t *ApiTransport) handleOnResponseHook(r *http.Response, metaData *OperationMetaData, buf *bytes.Buffer) (*http.Response, error) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}
	payload := hooks.OnResponseHookPayload{
		Response: hooks.WunderGraphResponse{
			Method:     r.Request.Method,
			RequestURI: r.Request.URL.String(),
			Headers:    hooks.HeaderSliceToCSV(r.Header),
			Body:       body,
			StatusCode: r.StatusCode,
			Status:     r.Status,
		},
		OperationName: metaData.OperationName,
		OperationType: metaData.GetOperationTypeString(),
	}
	hookData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	if user := authentication.UserFromContext(r.Request.Context()); user != nil {
		if userJson, err := json.Marshal(user); err == nil {
			hookData, _ = jsonparser.Set(hookData, userJson, "__wg", "user")
		}
	}

	out, err := t.hooksClient.DoGlobalRequest(r.Request.Context(), hooks.HttpTransportOnResponse, hookData, buf)
	if err != nil {
		return nil, err
	}

	var response hooks.OnResponseHookResponse
	err = json.Unmarshal(out.Response, &response)
	if err != nil {
		return nil, err
	}
	if response.Skip {
		r.Body = io.NopCloser(bytes.NewBuffer(body))
		return r, nil
	}
	if response.Cancel {
		return nil, errors.New("canceled")
	}
	if response.Response != nil {
		r.StatusCode = response.Response.StatusCode
		r.Body = io.NopCloser(bytes.NewBuffer(response.Response.Body))
		r.Header = hooks.HeaderCSVToSlice(response.Response.Headers)
	}
	return r, nil
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
