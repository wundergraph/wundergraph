package node

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"strings"
	"testing"
	"time"

	"github.com/gavv/httpexpect/v2"
	"github.com/jensneuse/abstractlogger"
	"github.com/phayes/freeport"
	"github.com/sebdah/goldie"
	"github.com/stretchr/testify/assert"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

func TestNode(t *testing.T) {

	logger := logging.New(abstractlogger.InfoLevel, true)

	userService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, http.MethodPost, r.Method)
		req, _ := httputil.DumpRequest(r, true)
		_ = req
		_, _ = w.Write([]byte(`{"data":{"me":{"id":"1234","username":"Me"}}}`))
	}))
	defer userService.Close()

	reviewService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		req, _ := httputil.DumpRequest(r, true)
		_ = req
		_, _ = w.Write([]byte(`{"data":{"_entities":[{"reviews": [{"body": "A highly effective form of birth control.","author":{"id":"1234","username":"Me"},"product": {"upc": "top-1"}},{"body": "Fedoras are one of the most fashionable hats around and can look great with a variety of outfits.","author":{"id":"1234","username":"Me"},"product": {"upc": "top-1"}}]}]}}`))
	}))
	defer reviewService.Close()

	productService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
		if bytes.Contains(req, []byte(`{"variables":{"representations":[{"__typename":"Product","upc":"top-1"}]},"query":"query($representations: [_Any!]!){_entities(representations: $representations){... on Product {name price}}}"}`)) {
			_, _ = w.Write([]byte(`{"data":{"_entities":[{"name":"Trilby","price":456}]}}`))
			return
		}
		w.WriteHeader(500)
	}))
	defer productService.Close()

	port, err := freeport.GetFreePort()
	assert.NoError(t, err)

	nodeURL := fmt.Sprintf(":%d", port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	node := New(ctx, BuildInfo{}, logger)

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
			PathPrefix:            "myApi/main",
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
					VariablesSchema:              `{}`,
					ResponseSchema:               `{}`,
					InterpolationVariablesSchema: `{}`,
					AuthorizationConfig: &wgpb.OperationAuthorizationConfig{
						RoleConfig: &wgpb.OperationRoleConfig{},
					},
				},
				{
					Name:          "TopProducts",
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
					Host: "127.0.0.1",
					Port: uint16(port),
				},
				Logging: &wgpb.Logging{Level: wgpb.LogLevel_ERROR},
			},
		},
	}

	go func() {
		err = node.StartBlocking(WithStaticWunderNodeConfig(nodeConfig))
		assert.NoError(t, err)
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

	e.GET("/myApi").Expect().Status(http.StatusNotFound)
	e.GET("/myApi/main/operations/MyReviews").Expect().Status(http.StatusNotFound)

	withHeaders := e.Builder(func(request *httpexpect.Request) {
		request.WithHeader("Host", "jens.wundergraph.dev")
	})

	myReviews := withHeaders.GET("/myApi/main/operations/MyReviews").
		WithQuery("unknown", 123).
		Expect().Status(http.StatusOK).Body().Raw()
	goldie.Assert(t, "get my reviews json rpc", prettyJSON(myReviews))

	topProductsWithoutQuery := withHeaders.GET("/myApi/main/operations/TopProducts").
		Expect().Status(http.StatusOK).Body().Raw()
	goldie.Assert(t, "top products without query", prettyJSON(topProductsWithoutQuery))

	topProductsWithQuery := withHeaders.GET("/myApi/main/operations/TopProducts").
		WithQuery("first", 1).
		WithQuery("unknown", 123).
		Expect().Status(http.StatusOK).Body().Raw()
	goldie.Assert(t, "top products with query", prettyJSON(topProductsWithQuery))

	request := GraphQLRequest{
		OperationName: "MyReviews",
		Query:         federationTestQuery,
	}

	actual := withHeaders.POST("/myApi/main/graphql").WithJSON(request).Expect().Status(http.StatusOK).Body().Raw()
	goldie.Assert(t, "post my reviews graphql", prettyJSON(actual))

	withHeaders.GET("/myApi/main/graphql").Expect().Status(http.StatusOK).Text(
		httpexpect.ContentOpts{MediaType: "text/html"})
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
	assert.NoError(t, err)

	nodeURL := fmt.Sprintf(":%d", port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	logger := logging.New(abstractlogger.InfoLevel, true)
	node := New(ctx, BuildInfo{}, logger)

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
			PathPrefix:            "api/main",
			ServerUrl:             testServer.URL,
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
				Listener: &apihandler.Listener{
					Host: "127.0.0.1",
					Port: uint16(port),
				},
				Logging: &wgpb.Logging{Level: wgpb.LogLevel_ERROR},
			},
		},
	}

	go func() {
		err = node.StartBlocking(WithStaticWunderNodeConfig(nodeConfig))
		assert.NoError(t, err)
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

	e.GET("/api/main/webhooks/github").Expect().Status(http.StatusOK)
	e.GET("/api/main/webhooks/stripe").Expect().Status(http.StatusOK)
	e.GET("/api/main/webhooks/undefined").Expect().Status(http.StatusNotFound)
	// We can't return 200 otherwise we would accept the delivery of the webhook and the publisher might not redeliver it.
	e.POST("/api/main/webhooks/github-protected").Expect().Status(http.StatusUnauthorized)
	e.POST("/api/main/webhooks/github-protected").WithBytes([]byte("ok")).WithHeader("X-Hub-Signature", fmt.Sprintf("sha256=%s", signatureString)).Expect().Status(http.StatusOK)

	assert.Equal(t, []string{"/webhooks/github", "/webhooks/stripe", "/webhooks/github-protected"}, paths)
}

func BenchmarkNode(t *testing.B) {

	logger := logging.New(abstractlogger.InfoLevel, true)

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
	assert.NoError(t, err)

	nodeURL := fmt.Sprintf(":%d", port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	node := New(ctx, BuildInfo{}, logger)

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
			PathPrefix:            "myApi",
			EngineConfiguration:   federationPlanConfiguration(userService.URL, productService.URL, reviewService.URL),
			EnableSingleFlight:    true,
			EnableGraphqlEndpoint: true,
			Operations: []*wgpb.Operation{
				{
					Name:          "MyReviews",
					Content:       federationTestQuery,
					OperationType: wgpb.OperationType_QUERY,
				},
			},
			Options: &apihandler.Options{
				Listener: &apihandler.Listener{
					Host: "127.0.0.1",
					Port: uint16(port),
				},
				Logging: &wgpb.Logging{Level: wgpb.LogLevel_ERROR},
			},
		},
	}

	go func() {
		err = node.StartBlocking(WithStaticWunderNodeConfig(nodeConfig))
		assert.NoError(t, err)
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
