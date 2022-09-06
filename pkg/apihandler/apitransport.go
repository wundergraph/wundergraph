package apihandler

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"github.com/buger/jsonparser"
	"github.com/dgrijalva/jwt-go"
	"github.com/wundergraph/graphql-go-tools/pkg/pool"

	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	pool2 "github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
	"github.com/wundergraph/wundergraph/pkg/authentication"
)

type ApiTransport struct {
	roundTripper               http.RoundTripper
	api                        *Api
	debugMode                  bool
	upstreamAuthConfigurations map[string]*wgpb.UpstreamAuthentication
	onRequestHook              map[string]struct{}
	onResponseHook             map[string]struct{}
	hooksClient                *hooks.Client
}

func NewApiTransportFactory(api *Api, hooksClient *hooks.Client, enableDebugMode bool) func(tripper http.RoundTripper) http.RoundTripper {
	return func(tripper http.RoundTripper) http.RoundTripper {
		return NewApiTransport(tripper, api, hooksClient, enableDebugMode)
	}
}

func NewApiTransport(tripper http.RoundTripper, api *Api, hooksClient *hooks.Client, enableDebugMode bool) http.RoundTripper {
	transport := &ApiTransport{
		roundTripper:               tripper,
		debugMode:                  enableDebugMode,
		api:                        api,
		upstreamAuthConfigurations: map[string]*wgpb.UpstreamAuthentication{},
		onResponseHook:             map[string]struct{}{},
		onRequestHook:              map[string]struct{}{},
		hooksClient:                hooksClient,
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
		if api.Operations[i].HooksConfiguration.HttpTransportOnRequest == true {
			transport.onRequestHook[name] = struct{}{}
		}
		if api.Operations[i].HooksConfiguration.HttpTransportOnResponse == true {
			transport.onResponseHook[name] = struct{}{}
		}
	}

	return transport
}

type Claims struct {
	Name string `json:"name"`
	jwt.StandardClaims
}

func (t *ApiTransport) RoundTrip(request *http.Request) (*http.Response, error) {

	if request.Header.Get("X-WG-Internal-GraphQL-API") == "true" {
		return t.internalGraphQLRoundTrip(request)
	}

	upstreamAuth, ok := t.upstreamAuthConfigurations[request.Host]
	if ok {
		err := t.handleUpstreamAuthentication(request, upstreamAuth)
		if err != nil {
			return nil, err
		}
	}

	return t.roundTrip(request)
}

func (t *ApiTransport) roundTrip(request *http.Request) (res *http.Response, err error) {

	var (
		onRequestHook, onResponseHook bool
	)

	metaData := getOperationMetaData(request)
	if metaData != nil {
		_, onRequestHook = t.onRequestHook[metaData.OperationName]
		_, onResponseHook = t.onResponseHook[metaData.OperationName]
	}

	if onRequestHook {
		request, err = t.handleOnRequestHook(request, metaData)
		if err != nil {
			return nil, err
		}
	}

	var requestDump []byte

	if t.debugMode {
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
	if request.Header.Get("Upgrade") != "" {
		if t.debugMode {
			fmt.Printf("\n\n--- DebugTransport ---\n\nRequest:\n\n%s\n\nDuration: %d ms\n\n--- DebugTransport\n\n",
				string(requestDump),
				duration,
			)
		}
		return t.roundTripper.RoundTrip(request)
	}

	if t.debugMode {
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
		return t.handleOnResponseHook(res, metaData)
	}

	return
}

// internalGraphQLRoundTrip is used to call the graphql-js servers, "embedded" into the fastify hook server
// using this transport, we're able to inject the user and original request as __wg body variables
// these get extracted by the fastify server
// so that the graphql-js context has access to the original user and request
func (t *ApiTransport) internalGraphQLRoundTrip(request *http.Request) (res *http.Response, err error) {
	request.Header.Del("X-WG-Internal-GraphQL-API")
	user := authentication.UserFromContext(request.Context())

	buf := pool.BytesBuffer.Get()
	defer pool.BytesBuffer.Put(buf)

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

	if clientRequest, ok := request.Context().Value(pool2.ClientRequestKey).(*http.Request); ok {
		requestJSON, err := hooks.HttpRequestToWunderGraphRequestJSON(clientRequest, false)
		if err != nil {
			return nil, err
		}
		requestBody, err = jsonparser.Set(requestBody, requestJSON, "__wg", "clientRequest")
	}

	req, err := http.NewRequestWithContext(request.Context(), request.Method, request.URL.String(), ioutil.NopCloser(bytes.NewReader(requestBody)))
	if err != nil {
		return nil, err
	}

	req.Header = request.Header.Clone()

	return t.roundTripper.RoundTrip(req)
}

func (t *ApiTransport) handleOnRequestHook(r *http.Request, metaData *OperationMetaData) (*http.Request, error) {
	var (
		body []byte
		err  error
	)
	if r.Body != nil {
		body, err = ioutil.ReadAll(r.Body)
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

	out, err := t.hooksClient.DoGlobalRequest(r.Context(), hooks.HttpTransportOnRequest, hookData)
	if err != nil {
		return nil, err
	}

	var response hooks.OnRequestHookResponse
	err = json.Unmarshal(out.Response, &response)
	if err != nil {
		return nil, err
	}
	if response.Skip {
		r.Body = ioutil.NopCloser(bytes.NewBuffer(body))
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

func (t *ApiTransport) handleOnResponseHook(r *http.Response, metaData *OperationMetaData) (*http.Response, error) {
	body, err := ioutil.ReadAll(r.Body)
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

	out, err := t.hooksClient.DoGlobalRequest(r.Request.Context(), hooks.HttpTransportOnResponse, hookData)
	if err != nil {
		return nil, err
	}

	var response hooks.OnResponseHookResponse
	err = json.Unmarshal(out.Response, &response)
	if err != nil {
		return nil, err
	}
	if response.Skip {
		r.Body = ioutil.NopCloser(bytes.NewBuffer(body))
		return r, nil
	}
	if response.Cancel {
		return nil, errors.New("canceled")
	}
	if response.Response != nil {
		r.StatusCode = response.Response.StatusCode
		r.Body = ioutil.NopCloser(bytes.NewBuffer(response.Response.Body))
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

		primaryHost := fmt.Sprintf("%s:%d", t.api.Options.Listener.Host, t.api.Options.Listener.Port)

		claims := &Claims{
			Name: user.Name,
			StandardClaims: jwt.StandardClaims{
				ExpiresAt: time.Now().Add(time.Minute * 15).Unix(),
				Issuer:    primaryHost,
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
