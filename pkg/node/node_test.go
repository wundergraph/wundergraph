package node

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"strings"
	"testing"
	"time"

	"github.com/gavv/httpexpect/v2"
	"github.com/phayes/freeport"
	"github.com/sebdah/goldie/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/telemetry/otel/trace"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

func TestNode(t *testing.T) {
	g := goldie.New(t, goldie.WithFixtureDir("fixtures"))

	logger := logging.New(true, false, zapcore.DebugLevel)

	userService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, http.MethodPost, r.Method)
		// the origin receives the traceparent header from the gateway
		assert.NotEmpty(t, r.Header.Get("traceparent"))
		req, _ := httputil.DumpRequest(r, true)
		_ = req
		if bytes.Contains(req, []byte(`{"query":"{me {id username}}"}`)) {
			_, _ = w.Write([]byte(`{"data":{"me":{"id":"1234","username":"Me"}}}`))
			return
		}
		w.WriteHeader(500)
	}))
	defer userService.Close()

	reviewService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "67b77eab-d1a5-4cd8-b908-8443f24502b6", r.Header.Get("X-Request-Id"))
		// the origin receives the traceparent header from the gateway
		assert.NotEmpty(t, r.Header.Get("traceparent"))
		req, _ := httputil.DumpRequest(r, true)
		_ = req
		if bytes.Contains(req, []byte(`{"variables":{"representations":[{"__typename":"User","id":"1234"}]},"query":"query($representations: [_Any!]!){_entities(representations: $representations){__typename ... on User {reviews {body author {id username} product {upc}}}}}"}`)) {
			_, _ = w.Write([]byte(`{"data":{"_entities":[{"__typename": "User","reviews": [{"body": "A highly effective form of birth control.","author":{"id":"1234","username":"Me"},"product": {"upc": "top-1"}},{"body": "Fedoras are one of the most fashionable hats around and can look great with a variety of outfits.","author":{"id":"1234","username":"Me"},"product": {"upc": "top-1"}}]}]}}`))
			return
		}
		if bytes.Contains(req, []byte(`{"variables":{"representations":[{"__typename":"Product","upc":"top-1"}]},"query":"query($representations: [_Any!]!){_entities(representations: $representations){__typename ... on Product {reviews {body author {id username}}}}}"}`)) {
			_, _ = w.Write([]byte(`{"data":{"_entities":[{"__typename": "Product","reviews": [{"body": "A highly effective form of birth control.","author":{"id":"1234","username":"Me"}},{"body": "Fedoras are one of the most fashionable hats around and can look great with a variety of outfits.","author":{"id":"1234","username":"Me"}}]}]}}`))
			return
		}
		w.WriteHeader(500)
	}))
	defer reviewService.Close()

	productService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "67b77eab-d1a5-4cd8-b908-8443f24502b6", r.Header.Get("X-Request-Id"))
		// the origin receives the traceparent header from the gateway
		assert.NotEmpty(t, r.Header.Get("traceparent"))
		req, _ := httputil.DumpRequest(r, true)
		_ = req
		if bytes.Contains(req, []byte(`{"variables":{},"query":"query($first: Int){topProducts(first: $first){upc name price}}"}`)) {
			_, _ = w.Write([]byte(`{"data":{"topProducts":[{"upc":"1","name":"A","price":1},{"upc":"2","name":"B","price":2}]}}`))
			return
		}
		if bytes.Contains(req, []byte(`{"variables":{"first":1},"query":"query($first: Int){topProducts(first: $first){upc name price}}"}`)) {
			_, _ = w.Write([]byte(`{"data":{"topProducts":[{"upc":"1","name":"A","price":1}]}}`))
			return
		}
		if bytes.Contains(req, []byte(`{"variables":{"representations":[{"__typename":"Product","upc":"top-1"}]},"query":"query($representations: [_Any!]!){_entities(representations: $representations){__typename ... on Product {name price}}}"}`)) {
			_, _ = w.Write([]byte(`{"data":{"_entities":[{"name":"Trilby","price":456}]}}`))
			return
		}
		w.WriteHeader(500)
	}))
	defer productService.Close()

	port, err := freeport.GetFreePort()
	require.NoError(t, err)

	nodeURL := fmt.Sprintf(":%d", port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	node := New(ctx, BuildInfo{}, "", logger)

	nodeConfig := WunderNodeConfig{
		Server: &Server{
			GracefulShutdownTimeout: 0,
			KeepAlive:               5,
			ReadTimeout:             5,
			WriteTimeout:            5,
			IdleTimeout:             5,
		},
		Api: &apihandler.Api{
			Hosts:                 []string{"jens.wundergraph.dev"},
			EngineConfiguration:   federationPlanConfiguration(userService.URL, productService.URL, reviewService.URL),
			EnableSingleFlight:    true,
			EnableGraphqlEndpoint: true,
			Operations: []*wgpb.Operation{
				{
					Name:          "MyReviews",
					Path:          "MyReviews",
					Content:       federationTestQuery,
					OperationType: wgpb.OperationType_QUERY,
					HooksConfiguration: &wgpb.OperationHooksConfiguration{
						MockResolve: &wgpb.MockResolveHookConfiguration{},
					},
					VariablesSchema:              `{}`,
					ResponseSchema:               `{}`,
					InterpolationVariablesSchema: `{}`,
					AuthorizationConfig: &wgpb.OperationAuthorizationConfig{
						RoleConfig: &wgpb.OperationRoleConfig{},
					},
				},
				{
					Name:          "TopProducts",
					Path:          "TopProducts",
					Content:       topProductsQuery,
					OperationType: wgpb.OperationType_QUERY,
					HooksConfiguration: &wgpb.OperationHooksConfiguration{
						MockResolve: &wgpb.MockResolveHookConfiguration{},
					},
					VariablesSchema:              `{"type":"object","properties":{"first":{"type":["number","null"]}}}`,
					ResponseSchema:               `{}`,
					InterpolationVariablesSchema: `{"type":"object","properties":{"first":{"type":["number","null"]}}}`,
					AuthorizationConfig: &wgpb.OperationAuthorizationConfig{
						RoleConfig: &wgpb.OperationRoleConfig{},
					},
				},
			},
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{},
				JwksBased:   &wgpb.JwksBasedAuthentication{},
				Hooks:       &wgpb.ApiAuthenticationHooks{},
			},
			Options: &apihandler.Options{
				Listener: &apihandler.Listener{
					Host: "localhost",
					Port: uint16(port),
				},
				Logging: apihandler.Logging{Level: zap.ErrorLevel},
				OpenTelemetry: &apihandler.OpenTelemetry{
					Enabled:                true,
					ExporterHTTPEndpoint:   "",
					ExporterJaegerEndpoint: "",
					AuthToken:              "",
				},
			},
		},
	}

	traceTestExporter := tracetest.NewInMemoryExporter()

	go func() {
		opts := []Option{
			WithStaticWunderNodeConfig(nodeConfig),
			WithTracerProviderInit(func(config WunderNodeConfig) (*trace.TracerProvider, error) {
				return trace.NewTestTracerProvider(traceTestExporter), nil
			}),
		}

		err = node.StartBlocking(opts...)
		require.NoError(t, err)
	}()

	time.Sleep(time.Second)

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL: "http://" + nodeURL,
		Client: &http.Client{
			Jar:     httpexpect.NewJar(),
			Timeout: time.Second * 30,
		},
		Reporter: httpexpect.NewRequireReporter(t),
	})

	e.GET("/operations/MyReviews").Expect().Status(http.StatusNotFound)
	spans := traceTestExporter.GetSpans()
	assert.Len(t, spans, 1)
	assert.Equal(t, "GET /operations/MyReviews", spans[0].Name)
	assert.Equal(t, codes.Ok, spans[0].Status.Code)
	assert.Len(t, spans[0].Attributes, 10)
	traceTestExporter.Reset()

	parentTraceID := "84e1afed08e019fc1110464cfa66635c"
	parentSpanID := "7a085853722dc6d2"
	traceParent := fmt.Sprintf("00-%s-%s-01", parentTraceID, parentSpanID)
	withHeaders := e.Builder(func(request *httpexpect.Request) {
		request.WithHeader("Host", "jens.wundergraph.dev")
		request.WithHeader("X-Request-Id", "67b77eab-d1a5-4cd8-b908-8443f24502b6")
		request.WithHeader("traceparent", traceParent)
	})

	myReviews := withHeaders.GET("/operations/MyReviews").
		WithQuery("unknown", 123).
		Expect().Status(http.StatusOK).Body().Raw()
	g.Assert(t, "get_my_reviews_json_rpc", prettyJSON(myReviews))
	spans = traceTestExporter.GetSpans()
	// 4 requests to the origin and 1 to the node
	assert.Len(t, spans, 5)
	// the order of spans is LIFO
	// get the first span
	assert.Equal(t, "GET /operations/MyReviews", spans[len(spans)-1].Name)
	assert.Equal(t, codes.Ok, spans[len(spans)-1].Status.Code)
	assert.Len(t, spans[len(spans)-1].Attributes, 11)

	containsSpanAttribute(t, spans[len(spans)-1].Attributes, "wg.operation.name", "MyReviews")
	containsSpanAttribute(t, spans[len(spans)-1].Attributes, "wg.operation.type", "QUERY")

	assert.Equal(t, 4, spans[len(spans)-1].ChildSpanCount)
	assert.Equal(t, parentTraceID, spans[len(spans)-1].Parent.TraceID().String())
	assert.Equal(t, parentSpanID, spans[len(spans)-1].Parent.SpanID().String())
	traceTestExporter.Reset()

	topProductsWithoutQuery := withHeaders.GET("/operations/TopProducts").
		Expect().Status(http.StatusOK).Body().Raw()
	g.Assert(t, "top_products_without_query", prettyJSON(topProductsWithoutQuery))
	traceTestExporter.Reset()

	topProductsWithQuery := withHeaders.GET("/operations/TopProducts").
		WithQuery("first", 1).
		WithQuery("unknown", 123).
		Expect().Status(http.StatusOK).Body().Raw()
	g.Assert(t, "top_products_with_query", prettyJSON(topProductsWithQuery))
	spans = traceTestExporter.GetSpans()
	// one request to the origin and one to the node
	assert.Len(t, spans, 2)
	assert.Equal(t, "GET /operations/TopProducts", spans[len(spans)-1].Name)
	assert.Equal(t, codes.Ok, spans[len(spans)-1].Status.Code)
	assert.Len(t, spans[len(spans)-1].Attributes, 11)

	containsSpanAttribute(t, spans[len(spans)-1].Attributes, "wg.operation.name", "TopProducts")
	containsSpanAttribute(t, spans[len(spans)-1].Attributes, "wg.operation.type", "QUERY")

	assert.Equal(t, 1, spans[len(spans)-1].ChildSpanCount)
	assert.Equal(t, parentTraceID, spans[len(spans)-1].Parent.TraceID().String())
	assert.Equal(t, parentSpanID, spans[len(spans)-1].Parent.SpanID().String())
	assert.Len(t, spans[0].Attributes, 8)
	traceTestExporter.Reset()

	topProductsWithInvalidQuery := withHeaders.GET("/operations/TopProducts").
		WithQuery("first", true).
		Expect().Status(http.StatusBadRequest).Body().Raw()
	g.Assert(t, "top_products_with_invalid_query", prettyJSON(topProductsWithInvalidQuery))
	traceTestExporter.Reset()

	topProductsWithQueryAsWgVariables := withHeaders.GET("/operations/TopProducts").
		WithQuery("wg_variables", `{"first":1}`).
		Expect().Status(http.StatusOK).Body().Raw()
	g.Assert(t, "top_products_with_query_as_wg_variables", prettyJSON(topProductsWithQueryAsWgVariables))
	traceTestExporter.Reset()

	topProductsWithInvalidQueryAsWgVariables := withHeaders.GET("/operations/TopProducts").
		WithQuery("wg_variables", `{"first":true}`).
		Expect().Status(http.StatusBadRequest).Body().Raw()
	g.Assert(t, "top_products_with_invalid_query_as_wg_variables", prettyJSON(topProductsWithInvalidQueryAsWgVariables))
	traceTestExporter.Reset()

	request := GraphQLRequest{
		OperationName: "MyReviews",
		Query:         federationTestQuery,
	}

	actual := withHeaders.POST("/graphql").WithJSON(request).Expect().Status(http.StatusOK).Body().Raw()
	g.Assert(t, "post_my_reviews_graphql", prettyJSON(actual))
	spans = traceTestExporter.GetSpans()
	assert.Len(t, spans, 5)
	assert.Equal(t, "POST /graphql", spans[len(spans)-1].Name)
	assert.Len(t, spans[len(spans)-1].Attributes, 9)
	traceTestExporter.Reset()

	withHeaders.GET("/graphql").Expect().Status(http.StatusOK).Text(
		httpexpect.ContentOpts{MediaType: "text/html"})

	failingRequest := GraphQLRequest{
		OperationName: "MyReviews",
		Query: `query MyReviews {
						me {
							id
							name
							reviews {
								body
							},
					}
				}`,
	}

	actual = withHeaders.POST("/graphql").WithJSON(failingRequest).Expect().Status(http.StatusOK).Body().Raw()
	g.Assert(t, "post_my_reviews_graphql_returns_valid_graphql_error", prettyJSON(actual))
}

func TestInMemoryCache(t *testing.T) {
	g := goldie.New(t, goldie.WithFixtureDir("fixtures"))

	logger := logging.New(true, false, zapcore.DebugLevel)

	productService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		data, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatal(err)
		}
		if bytes.Contains(data, []byte(`{"variables":{},"query":"query($first: Int){topProducts(first: $first){upc name price}}"}`)) {
			if _, err := io.WriteString(w, `{"data":{"topProducts":[{"upc":"1","name":"A","price":1},{"upc":"2","name":"B","price":2}]}}`); err != nil {
				t.Fatal(err)
			}
			return
		}
		w.WriteHeader(500)
	}))
	defer productService.Close()

	port, err := freeport.GetFreePort()
	require.NoError(t, err)

	nodeURL := fmt.Sprintf(":%d", port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	node := New(ctx, BuildInfo{}, "", logger)

	nodeConfig := WunderNodeConfig{
		Server: &Server{
			GracefulShutdownTimeout: 0,
			KeepAlive:               5,
			ReadTimeout:             5,
			WriteTimeout:            5,
			IdleTimeout:             5,
		},
		Api: &apihandler.Api{
			Hosts:                 []string{"jens.wundergraph.dev"},
			EngineConfiguration:   federationPlanConfiguration("", productService.URL, ""),
			EnableSingleFlight:    true,
			EnableGraphqlEndpoint: true,
			Operations: []*wgpb.Operation{
				{
					Name:    "TopProducts",
					Path:    "TopProducts",
					Content: topProductsQuery,
					CacheConfig: &wgpb.OperationCacheConfig{
						Enable:               true,
						MaxAge:               60,
						Public:               true,
						StaleWhileRevalidate: 60,
					},
					OperationType: wgpb.OperationType_QUERY,
					HooksConfiguration: &wgpb.OperationHooksConfiguration{
						MockResolve: &wgpb.MockResolveHookConfiguration{},
					},
					VariablesSchema:              `{"type":"object","properties":{"first":{"type":["number","null"]}}}`,
					ResponseSchema:               `{}`,
					InterpolationVariablesSchema: `{"type":"object","properties":{"first":{"type":["number","null"]}}}`,
					AuthorizationConfig: &wgpb.OperationAuthorizationConfig{
						RoleConfig: &wgpb.OperationRoleConfig{},
					},
				},
			},
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{},
				JwksBased:   &wgpb.JwksBasedAuthentication{},
				Hooks:       &wgpb.ApiAuthenticationHooks{},
			},
			CacheConfig: &wgpb.ApiCacheConfig{
				Kind: wgpb.ApiCacheKind_IN_MEMORY_CACHE,
				InMemoryConfig: &wgpb.InMemoryCacheConfig{
					MaxSize: 16 * 1024 * 1024,
				},
			},
			Options: &apihandler.Options{
				Listener: &apihandler.Listener{
					Host: "localhost",
					Port: uint16(port),
				},
				Logging: apihandler.Logging{Level: zap.ErrorLevel},
				OpenTelemetry: &apihandler.OpenTelemetry{
					Enabled:                false,
					ExporterJaegerEndpoint: "",
					ExporterHTTPEndpoint:   "",
					AuthToken:              "",
				},
			},
		},
	}

	go func() {
		opts := []Option{
			WithStaticWunderNodeConfig(nodeConfig),
			WithTracerProviderInit(func(config WunderNodeConfig) (*trace.TracerProvider, error) {
				return trace.NewNoopTracerProvider(), nil
			}),
		}

		err = node.StartBlocking(opts...)
		require.NoError(t, err)
	}()

	time.Sleep(time.Second)

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL: "http://" + nodeURL,
		Client: &http.Client{
			Jar:     httpexpect.NewJar(),
			Timeout: time.Second * 30,
		},
		Reporter: httpexpect.NewRequireReporter(t),
	})

	withHeaders := e.Builder(func(request *httpexpect.Request) {
		request.WithHeader("Host", "jens.wundergraph.dev")
	})

	const (
		cacheHeaderName  = "X-Wg-Cache"
		expectedDataName = "top_products_without_query"
	)

	// Send a request to populate the cache
	cold := withHeaders.GET("/operations/TopProducts").Expect()
	cold.Status(http.StatusOK).Header(cacheHeaderName).Equal("MISS")
	g.Assert(t, expectedDataName, prettyJSON(cold.Body().Raw()))

	// Close the origin, so request can only be answered from the in-memory cache
	productService.Close()
	hot := withHeaders.GET("/operations/TopProducts").Expect()
	hot.Status(http.StatusOK).Header(cacheHeaderName).Equal("HIT")
	g.Assert(t, expectedDataName, prettyJSON(hot.Body().Raw()))
}

func TestWebHooks(t *testing.T) {
	var paths []string

	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
		paths = append(paths, r.URL.Path)
	}))
	defer testServer.Close()

	port, err := freeport.GetFreePort()
	require.NoError(t, err)

	nodeURL := fmt.Sprintf(":%d", port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logger := logging.New(true, false, zapcore.DebugLevel)
	node := New(ctx, BuildInfo{}, "", logger)

	nodeConfig := WunderNodeConfig{
		Server: &Server{
			GracefulShutdownTimeout: 0,
			KeepAlive:               5,
			ReadTimeout:             5,
			WriteTimeout:            5,
			IdleTimeout:             5,
		},
		Api: &apihandler.Api{
			Hosts:                 []string{"localhost"},
			EnableSingleFlight:    true,
			EnableGraphqlEndpoint: true,
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{},
				JwksBased:   &wgpb.JwksBasedAuthentication{},
				Hooks:       &wgpb.ApiAuthenticationHooks{},
			},
			Webhooks: []*wgpb.WebhookConfiguration{
				{
					Name: "github",
				},
				{
					Name: "stripe",
				},
				{
					Name: "github-protected",
					Verifier: &wgpb.WebhookVerifier{
						Kind:                  wgpb.WebhookVerifierKind_HMAC_SHA256,
						SignatureHeader:       "X-Hub-Signature",
						SignatureHeaderPrefix: "sha256=",
						Secret: &wgpb.ConfigurationVariable{
							Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
							StaticVariableContent: "secret",
						},
					},
				},
			},
			Options: &apihandler.Options{
				ServerUrl: testServer.URL,
				Listener: &apihandler.Listener{
					Host: "localhost",
					Port: uint16(port),
				},
				Logging: apihandler.Logging{Level: zap.ErrorLevel},
				OpenTelemetry: &apihandler.OpenTelemetry{
					Enabled:                true,
					ExporterJaegerEndpoint: "",
					ExporterHTTPEndpoint:   "",
				},
			},
		},
	}

	traceTestExporter := tracetest.NewInMemoryExporter()

	go func() {
		opts := []Option{
			WithStaticWunderNodeConfig(nodeConfig),
			WithTracerProviderInit(func(config WunderNodeConfig) (*trace.TracerProvider, error) {
				return trace.NewTestTracerProvider(traceTestExporter), nil
			}),
		}

		err = node.StartBlocking(opts...)
		require.NoError(t, err)
	}()

	time.Sleep(time.Second)

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL: "http://" + nodeURL,
		Client: &http.Client{
			Jar:     httpexpect.NewJar(),
			Timeout: time.Second * 30,
		},
		Reporter: httpexpect.NewRequireReporter(t),
	})

	hash := hmac.New(sha256.New, []byte("secret"))
	_, _ = hash.Write([]byte("ok"))
	signatureString := hex.EncodeToString(hash.Sum(nil))

	e.GET("/webhooks/github").Expect().Status(http.StatusOK)
	spans := traceTestExporter.GetSpans()
	assert.Len(t, spans, 1)
	assert.Equal(t, "GET /webhooks/github", spans[0].Name)
	assert.Len(t, spans[0].Attributes, 10)
	assert.Equal(t, codes.Ok, spans[0].Status.Code)
	traceTestExporter.Reset()

	e.GET("/webhooks/stripe").Expect().Status(http.StatusOK)
	e.GET("/webhooks/undefined").Expect().Status(http.StatusNotFound)
	// We can't return 200 otherwise we would accept the delivery of the webhook and the publisher might not redeliver it.
	e.POST("/webhooks/github-protected").Expect().Status(http.StatusUnauthorized)
	e.POST("/webhooks/github-protected").WithBytes([]byte("ok")).WithHeader("X-Hub-Signature", fmt.Sprintf("sha256=%s", signatureString)).Expect().Status(http.StatusOK)
	spans = traceTestExporter.GetSpans()
	assert.Len(t, spans, 3)

	assert.Equal(t, []string{"/webhooks/github", "/webhooks/stripe", "/webhooks/github-protected"}, paths)
}

func BenchmarkNode(t *testing.B) {
	logger := logging.New(true, false, zapcore.DebugLevel)

	userService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"data":{"me":{"id":"1234","username":"Me"}}}`))
	}))
	defer userService.Close()

	reviewService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"data":{"_entities":[{"reviews": [{"body": "A highly effective form of birth control.","author":{"id":"1234","username":"Me"},"product": {"upc": "top-1"}},{"body": "Fedoras are one of the most fashionable hats around and can look great with a variety of outfits.","author":{"id":"1234","username":"Me"},"product": {"upc": "top-1"}}]}]}}`))
	}))
	defer reviewService.Close()

	productService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"data":{"_entities":[{"name": "Trilby","price":456}]}}`))
	}))
	defer productService.Close()

	port, err := freeport.GetFreePort()
	require.NoError(t, err)

	nodeURL := fmt.Sprintf(":%d", port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	node := New(ctx, BuildInfo{}, "", logger)

	nodeConfig := WunderNodeConfig{
		Server: &Server{
			GracefulShutdownTimeout: 0,
			KeepAlive:               0,
			ReadTimeout:             5,
			WriteTimeout:            5,
			IdleTimeout:             5,
		},
		Api: &apihandler.Api{
			Hosts:                 []string{"jens.wundergraph.dev"},
			EngineConfiguration:   federationPlanConfiguration(userService.URL, productService.URL, reviewService.URL),
			EnableSingleFlight:    true,
			EnableGraphqlEndpoint: true,
			Operations: []*wgpb.Operation{
				{
					Name:          "MyReviews",
					Content:       federationTestQuery,
					OperationType: wgpb.OperationType_QUERY,
					HooksConfiguration: &wgpb.OperationHooksConfiguration{
						MockResolve: &wgpb.MockResolveHookConfiguration{},
					},
					VariablesSchema:              "{}",
					InterpolationVariablesSchema: "{}",
					AuthorizationConfig: &wgpb.OperationAuthorizationConfig{
						RoleConfig: &wgpb.OperationRoleConfig{},
					},
				},
			},
			Options: &apihandler.Options{
				Listener: &apihandler.Listener{
					Host: "localhost",
					Port: uint16(port),
				},
				Logging: apihandler.Logging{Level: zap.ErrorLevel},
				OpenTelemetry: &apihandler.OpenTelemetry{
					Enabled:                false,
					ExporterJaegerEndpoint: "",
					ExporterHTTPEndpoint:   "",
				},
			},
			AuthenticationConfig: &wgpb.ApiAuthenticationConfig{
				CookieBased: &wgpb.CookieBasedAuthentication{
					HashKey:    &wgpb.ConfigurationVariable{},
					BlockKey:   &wgpb.ConfigurationVariable{},
					CsrfSecret: &wgpb.ConfigurationVariable{},
				},
				Hooks:     &wgpb.ApiAuthenticationHooks{},
				JwksBased: &wgpb.JwksBasedAuthentication{},
			},
		},
	}

	go func() {
		opts := []Option{
			WithStaticWunderNodeConfig(nodeConfig),
			WithTracerProviderInit(func(config WunderNodeConfig) (*trace.TracerProvider, error) {
				return trace.NewNoopTracerProvider(), nil
			}),
		}

		err = node.StartBlocking(opts...)
		require.NoError(t, err)
	}()

	time.Sleep(time.Millisecond * 100)

	// expected := "{\"data\":{\"me\":{\"id\":\"1234\",\"username\":\"Me\",\"reviews\":[{\"body\":\"A highly effective form of birth control.\",\"author\":{\"id\":\"1234\",\"username\":\"Me\"},\"product\":{\"name\":\"Trilby\",\"price\":456,\"reviews\":[{\"body\":\"A highly effective form of birth control.\",\"author\":{\"id\":\"1234\",\"username\":\"Me\"}},{\"body\":\"Fedoras are one of the most fashionable hats around and can look great with a variety of outfits.\",\"author\":{\"id\":\"1234\",\"username\":\"Me\"}}]}},{\"body\":\"Fedoras are one of the most fashionable hats around and can look great with a variety of outfits.\",\"author\":{\"id\":\"1234\",\"username\":\"Me\"},\"product\":{\"name\":\"Trilby\",\"price\":456,\"reviews\":[{\"body\":\"A highly effective form of birth control.\",\"author\":{\"id\":\"1234\",\"username\":\"Me\"}},{\"body\":\"Fedoras are one of the most fashionable hats around and can look great with a variety of outfits.\",\"author\":{\"id\":\"1234\",\"username\":\"Me\"}}]}}]}}}"

	client := http.Client{Timeout: time.Second}

	t.ResetTimer()
	t.ReportAllocs()

	for i := 0; i < t.N; i++ {

		request, err := http.NewRequest(http.MethodGet, fmt.Sprintf("http://0.0.0.0%s/myApi/MyReviews", nodeURL), nil)
		if err != nil {
			t.Fatal(err)
		}

		request.Host = "jens.wundergraph.dev"

		out, err := client.Do(request)
		if err != nil {
			t.Fatal(err)
		}

		if out.StatusCode != http.StatusOK {
			t.Fatal("status code")
		}
	}
}

func containsSpanAttribute(t *testing.T, attributes []attribute.KeyValue, key, val string) {
	attributeSet := attribute.NewSet(attributes...)

	value, has := attributeSet.Value(attribute.Key(key))
	assert.True(t, has)
	assert.Equal(t, val, value.AsString())
}

func prettyJSON(in string) []byte {
	var un interface{}
	_ = json.Unmarshal([]byte(in), &un)
	out, _ := json.MarshalIndent(un, "", "  ")
	return out
}

type GraphQLRequest struct {
	OperationName string          `json:"operation_name"`
	Query         string          `json:"query"`
	Variables     json.RawMessage `json:"variables"`
}

var (
	topProductsQuery = `
		query TopProducts ($first: Int){
    topProducts: topProducts(first: $first) {
        upc
        name
        price
    }
}
`
	federationTestQuery = `query MyReviews {
						me {
							id
							username
							reviews {
								body
								author {
									id
									username
								}	
								product {
									name
									price
									reviews {
										body
										author {
											id
											username
										}
									}
								}
							}
						}
					}`
)

func federationPlanConfiguration(userServiceURL, productServiceURL, reviewServiceURL string) *wgpb.EngineConfiguration {
	return &wgpb.EngineConfiguration{
		DatasourceConfigurations: []*wgpb.DataSourceConfiguration{
			{
				Kind: wgpb.DataSourceKind_GRAPHQL,
				RootNodes: []*wgpb.TypeField{
					{
						TypeName:   "Query",
						FieldNames: []string{"me"},
					},
				},
				ChildNodes: []*wgpb.TypeField{
					{
						TypeName:   "User",
						FieldNames: []string{"id", "username"},
					},
				},
				CustomGraphql: &wgpb.DataSourceCustom_GraphQL{
					Fetch: &wgpb.FetchConfiguration{
						Url: &wgpb.ConfigurationVariable{
							Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
							StaticVariableContent: userServiceURL,
						},
						Method: wgpb.HTTPMethod_POST,
					},
					Subscription: &wgpb.GraphQLSubscriptionConfiguration{
						Url: &wgpb.ConfigurationVariable{
							Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
							StaticVariableContent: strings.Replace(userServiceURL, "http", "ws", -1),
						},
					},
					HooksConfiguration: &wgpb.GraphQLDataSourceHooksConfiguration{
						OnWSTransportConnectionInit: false,
					},
					Federation: &wgpb.GraphQLFederationConfiguration{
						Enabled:    true,
						ServiceSdl: "extend type Query {me: User} type User @key(fields: \"id\"){ id: ID! username: String!}",
					},
				},
			},
			{
				Kind: wgpb.DataSourceKind_GRAPHQL,
				RootNodes: []*wgpb.TypeField{
					{
						TypeName:   "Query",
						FieldNames: []string{"topProducts"},
					},
					{
						TypeName:   "Subscription",
						FieldNames: []string{"updatedPrice"},
					},
					{
						TypeName:   "Product",
						FieldNames: []string{"upc", "name", "price"},
					},
				},
				ChildNodes: []*wgpb.TypeField{
					{
						TypeName:   "Product",
						FieldNames: []string{"upc", "name", "price"},
					},
				},
				CustomGraphql: &wgpb.DataSourceCustom_GraphQL{
					Fetch: &wgpb.FetchConfiguration{
						Url: &wgpb.ConfigurationVariable{
							Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
							StaticVariableContent: productServiceURL,
						},
						Method: wgpb.HTTPMethod_POST,
					},
					Federation: &wgpb.GraphQLFederationConfiguration{
						Enabled:    true,
						ServiceSdl: "extend type Query {topProducts(first: Int = 5): [Product]} type Product @key(fields: \"upc\") {upc: String! name: String! price: Int!}",
					},
					Subscription: &wgpb.GraphQLSubscriptionConfiguration{
						Url: &wgpb.ConfigurationVariable{
							Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
							StaticVariableContent: strings.Replace(productServiceURL, "http", "ws", -1),
						},
					},
					HooksConfiguration: &wgpb.GraphQLDataSourceHooksConfiguration{
						OnWSTransportConnectionInit: false,
					},
				},
			},
			{
				Kind: wgpb.DataSourceKind_GRAPHQL,
				RootNodes: []*wgpb.TypeField{
					{
						TypeName:   "User",
						FieldNames: []string{"reviews"},
					},
					{
						TypeName:   "Product",
						FieldNames: []string{"reviews"},
					},
				},
				ChildNodes: []*wgpb.TypeField{
					{
						TypeName:   "Review",
						FieldNames: []string{"body", "author", "product"},
					},
					{
						TypeName:   "User",
						FieldNames: []string{"id", "username"},
					},
					{
						TypeName:   "Product",
						FieldNames: []string{"upc"},
					},
				},
				CustomGraphql: &wgpb.DataSourceCustom_GraphQL{
					Fetch: &wgpb.FetchConfiguration{
						Url: &wgpb.ConfigurationVariable{
							Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
							StaticVariableContent: reviewServiceURL,
						},
						Method: wgpb.HTTPMethod_POST,
					},
					Federation: &wgpb.GraphQLFederationConfiguration{
						Enabled:    true,
						ServiceSdl: "type Review { body: String! author: User! @provides(fields: \"username\") product: Product! } extend type User @key(fields: \"id\") { id: ID! @external reviews: [Review] } extend type Product @key(fields: \"upc\") { upc: String! @external reviews: [Review] }",
					},
					Subscription: &wgpb.GraphQLSubscriptionConfiguration{
						Url: &wgpb.ConfigurationVariable{
							Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
							StaticVariableContent: strings.Replace(reviewServiceURL, "http", "ws", -1),
						},
					},
					HooksConfiguration: &wgpb.GraphQLDataSourceHooksConfiguration{
						OnWSTransportConnectionInit: false,
					},
				},
			},
		},
		FieldConfigurations: []*wgpb.FieldConfiguration{
			{
				TypeName:  "Query",
				FieldName: "topProducts",
				ArgumentsConfiguration: []*wgpb.ArgumentConfiguration{
					{
						Name:       "first",
						SourceType: wgpb.ArgumentSource_FIELD_ARGUMENT,
					},
				},
			},
			{
				TypeName:       "User",
				FieldName:      "reviews",
				RequiresFields: []string{"id"},
			},
			{
				TypeName:       "Product",
				FieldName:      "name",
				RequiresFields: []string{"upc"},
			},
			{
				TypeName:       "Product",
				FieldName:      "price",
				RequiresFields: []string{"upc"},
			},
			{
				TypeName:       "Product",
				FieldName:      "reviews",
				RequiresFields: []string{"upc"},
			},
		},
		GraphqlSchema:        federationTestSchema,
		DefaultFlushInterval: 500,
	}
}

const federationTestSchema = `
scalar String
scalar Int
scalar ID

schema {
	query: Query
}

type Product {
  upc: String!
  name: String!
  price: Int!
  reviews: [Review]
}

type Query {
  me: User
  topProducts(first: Int = 5): [Product]
}

type Review {
  body: String!
  author: User!
  product: Product!
}

type User {
  id: ID!
  username: String!
  reviews: [Review]
}
`
