package apihandler

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gavv/httpexpect/v2"
	"github.com/jensneuse/abstractlogger"
	"github.com/stretchr/testify/assert"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"

	"github.com/wundergraph/wundergraph/pkg/apicache"
	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/inputvariables"
	"github.com/wundergraph/wundergraph/pkg/interpolate"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/postresolvetransform"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type FakeResolver struct {
	invocations int
	response    []byte
	validate    func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte)
}

func (f *FakeResolver) ResolveGraphQLResponse(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte, writer io.Writer) (err error) {
	if f.validate != nil {
		f.validate(ctx, response, data)
	}
	f.invocations++
	_, err = writer.Write(f.response)
	return
}

func TestQueryHandler_VariablesIgnore(t *testing.T) {

	interpoalteNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

	validateNothing, err := inputvariables.NewValidator(inputSchema, true)
	assert.NoError(t, err)

	validateCalled := false

	handler := &QueryHandler{
		resolver: &FakeResolver{
			response: []byte(`{"data":{"me":{"name":"Jens"}}}`),
			validate: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) {
				assert.Equal(t, `{"id":123}`, string(ctx.Variables))
				validateCalled = true
			},
		},
		log: &abstractlogger.Noop{},
		preparedPlan: &plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{},
		},
		pool: pool.New(),
		operation: &wgpb.Operation{
			Name:          "test",
			OperationType: wgpb.OperationType_QUERY,
		},
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpoalteNothing,
		jsonStringInterpolator: interpoalteNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
		queryParamsAllowList:   []string{"id"},
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  srv.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	res := e.GET("/api/main/operations").
		WithQuery("id", `123`).
		WithQuery("unknown", `456`).
		Expect()

	res.Status(http.StatusOK)
	res.Body().Equal(`{"data":{"me":{"name":"Jens"}}}`)

	assert.True(t, validateCalled)
}

func TestQueryHandler_ETag(t *testing.T) {

	interpoalteNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	validateNothing, err := inputvariables.NewValidator(`{"type":"object","properties":{"id":{"type":"number"}}}`, true)
	assert.NoError(t, err)

	handler := &QueryHandler{
		resolver: &FakeResolver{
			response: []byte(`{"data":{"me":{"name":"Jens"}}}`),
		},
		log: &abstractlogger.Noop{},
		preparedPlan: &plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{},
		},
		pool: pool.New(),
		operation: &wgpb.Operation{
			Name:          "test",
			OperationType: wgpb.OperationType_QUERY,
		},
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpoalteNothing,
		jsonStringInterpolator: interpoalteNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  srv.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	res := e.GET("/api/main/operations").
		WithQuery("wg_variables", `{"id":123}`).
		Expect()

	res.Status(http.StatusOK)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Body().Equal(`{"data":{"me":{"name":"Jens"}}}`)

	res = e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		WithHeader("If-None-Match", "W/\"15825766644480138524\"").
		Expect()

	res.Status(http.StatusNotModified)
}

func TestQueryHandler_Caching(t *testing.T) {

	interpoalteNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	validateNothing, err := inputvariables.NewValidator(`{"type":"object","properties":{"id":{"type":"number"}}}`, true)
	assert.NoError(t, err)

	cache, err := apicache.NewInMemory(1e4)
	assert.NoError(t, err)

	resolver := &FakeResolver{
		response: []byte(`{"data":{"me":{"name":"Jens"}}}`),
	}

	handler := &QueryHandler{
		resolver: resolver,
		log:      &abstractlogger.Noop{},
		preparedPlan: &plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{},
		},
		pool: pool.New(),
		cacheConfig: cacheConfig{
			enable:               true,
			maxAge:               2,
			public:               true,
			staleWhileRevalidate: 0,
		},
		cache: cache,
		operation: &wgpb.Operation{
			Name:          "test",
			OperationType: wgpb.OperationType_QUERY,
		},
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpoalteNothing,
		jsonStringInterpolator: interpoalteNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  srv.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	res := e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		Expect()

	res.Status(http.StatusOK)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Headers().ValueEqual("Cache-Control", []string{"public, max-age=2, stale-while-revalidate=0"})
	res.Headers().ValueEqual("Age", []string{"0"})
	res.Headers().ValueEqual("X-Cache", []string{"MISS"})
	res.Body().Equal(`{"data":{"me":{"name":"Jens"}}}`)

	handler.cacheConfig.public = false

	time.Sleep(time.Second)

	res = e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		Expect()

	res.Status(http.StatusOK)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Headers().ValueEqual("Cache-Control", []string{"private, max-age=2, stale-while-revalidate=0"})
	res.Headers().ValueEqual("Age", []string{"1"})
	res.Headers().ValueEqual("X-Cache", []string{"HIT"})
	res.Body().Equal(`{"data":{"me":{"name":"Jens"}}}`)

	assert.Equal(t, 1, resolver.invocations)

	res = e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		WithHeader("If-None-Match", "W/\"15825766644480138524\"").
		Expect()

	res.Status(http.StatusNotModified)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Headers().ValueEqual("Cache-Control", []string{"private, max-age=2, stale-while-revalidate=0"})
	res.Headers().ValueEqual("Age", []string{"1"})
	res.Headers().ValueEqual("X-Cache", []string{"HIT"})
	res.Body().Empty()

	time.Sleep(time.Second * 2)

	res = e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		Expect()

	res.Status(http.StatusOK)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Headers().ValueEqual("Cache-Control", []string{"private, max-age=2, stale-while-revalidate=0"})
	res.Headers().ValueEqual("Age", []string{"0"})
	res.Headers().ValueEqual("X-Cache", []string{"MISS"})
	res.Body().Equal(`{"data":{"me":{"name":"Jens"}}}`)

	assert.Equal(t, 2, resolver.invocations)

	time.Sleep(time.Second)

	res = e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		WithHeader("If-None-Match", "W/\"15825766644480138524\"").
		Expect()

	res.Status(http.StatusNotModified)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Headers().ValueEqual("Cache-Control", []string{"private, max-age=2, stale-while-revalidate=0"})
	res.Headers().ValueEqual("Age", []string{"1"})
	res.Headers().ValueEqual("X-Cache", []string{"HIT"})
	res.Body().Empty()

	assert.Equal(t, 2, resolver.invocations)
}

func TestLogMiddleware_Debug(t *testing.T) {
	const (
		testFileContents     = "this_should_be_omitted"
		testFormContents     = "this_should_be_logged"
		responseBodyContents = "hello"
	)
	var buf bytes.Buffer
	middleware := logRequestMiddleware(&buf)

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, responseBodyContents)
	})

	srv := httptest.NewServer(middleware(handler))
	defer srv.Close()

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  srv.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	t.Run("Should not log file contents", func(t *testing.T) {
		buf.Reset()
		res := e.POST("/").WithMultipart().WithFileBytes("file", "file.txt", []byte(testFileContents)).Expect()
		res.Body().Contains(responseBodyContents)
		assert.NotContains(t, buf.String(), testFileContents, "Should not contain the file")
	})
	t.Run("Should log form values", func(t *testing.T) {
		buf.Reset()
		res := e.POST("/").WithForm(map[string]string{"value": testFormContents}).Expect()
		res.Body().Contains(responseBodyContents)
		assert.Contains(t, buf.String(), testFormContents, "Should contain form values")

	})
}
