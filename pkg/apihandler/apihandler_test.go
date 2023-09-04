package apihandler

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gavv/httpexpect/v2"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"

	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/cacheheaders"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/inputvariables"
	"github.com/wundergraph/wundergraph/pkg/interpolate"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/postresolvetransform"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type FakeResolver struct {
	invocations int
	resolve     func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) []byte
	validate    func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte)
}

func (f *FakeResolver) ResolveGraphQLResponse(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte, writer io.Writer) (err error) {
	if f.validate != nil {
		f.validate(ctx, response, data)
	}
	f.invocations++
	_, err = writer.Write(f.resolve(ctx, response, data))
	return
}

func (f *FakeResolver) ResolveGraphQLSubscription(ctx *resolve.Context, subscription *resolve.GraphQLSubscription, writer resolve.FlushWriter) error {
	return errors.New("unimplemented")
}

type FakeSubscriptionResolver struct {
	resolve func(ctx *resolve.Context, subscription *resolve.GraphQLSubscription, writer resolve.FlushWriter) (err error)
}

func (f *FakeSubscriptionResolver) ResolveGraphQLSubscription(ctx *resolve.Context, subscription *resolve.GraphQLSubscription, writer resolve.FlushWriter) (err error) {
	return f.resolve(ctx, subscription, writer)
}

func newPipeline(resolver *FakeResolver, operation *wgpb.Operation) *hooks.SynchronousOperationPipeline {
	preparedPlan := &plan.SynchronousResponsePlan{
		Response: &resolve.GraphQLResponse{},
	}
	config := hooks.SynchronousOperationPipelineConfig{
		PipelineConfig: hooks.PipelineConfig{
			Operation:   operation,
			Transformer: &postresolvetransform.Transformer{},
			Logger:      zap.NewNop(),
		},
		Resolver: resolver,
		Plan:     preparedPlan,
	}
	return hooks.NewSynchronousOperationPipeline(config)
}

func TestQueryHandler_VariablesIgnore(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

	validateNothing, err := inputvariables.NewValidator(inputSchema, true)
	assert.NoError(t, err)

	var validateCalled atomic.Bool

	resolver := &FakeResolver{
		resolve: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) []byte {
			return []byte(`{"data":{"me":{"name":"Jens"}}}`)
		},
		validate: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) {
			assert.Equal(t, `{"id":123}`, string(ctx.Variables))
			validateCalled.Store(true)
		},
	}
	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}
	handler := &QueryHandler{
		resolver: resolver,
		log:      zap.NewNop(),
		preparedPlan: &plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{},
		},
		pool:                   pool.New(),
		operation:              operation,
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpolateNothing,
		jsonStringInterpolator: interpolateNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
		queryParamsAllowList:   []string{"id"},
		hooksPipeline:          newPipeline(resolver, operation),
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  srv.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	res := e.GET("/operations").
		WithQuery("id", `123`).
		WithQuery("unknown", `456`).
		Expect()

	res.Status(http.StatusOK)
	res.Body().Equal(`{"data":{"me":{"name":"Jens"}}}`)

	assert.True(t, validateCalled.Load())
}

func TestQueryHandler_ETag(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	validateNothing, err := inputvariables.NewValidator(`{"type":"object","properties":{"id":{"type":"number"}}}`, true)
	assert.NoError(t, err)

	resolver := &FakeResolver{
		resolve: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) []byte {
			return []byte(`{"data":{"me":{"name":"Jens"}}}`)
		},
	}
	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}

	handler := &QueryHandler{
		resolver: resolver,
		log:      zap.NewNop(),
		preparedPlan: &plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{},
		},
		pool:                   pool.New(),
		cacheHeaders:           cacheheaders.New(nil, ""),
		operation:              operation,
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpolateNothing,
		jsonStringInterpolator: interpolateNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
		hooksPipeline:          newPipeline(resolver, operation),
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  srv.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	res := e.GET("/operations").
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

func TestQueryHandler_LiveQuery(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

	validateNothing, err := inputvariables.NewValidator(inputSchema, true)
	assert.NoError(t, err)

	var validateCalled atomic.Bool
	counter := 0

	resolver := &FakeResolver{
		resolve: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) []byte {
			defer func() {
				counter++
			}()
			return []byte(`{"data":{"me":{"name":"Jens","counter":` + strconv.Itoa(counter) + `}}}`)
		},
		validate: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) {
			assert.Equal(t, `{"id":123}`, string(ctx.Variables))
			validateCalled.Store(true)
		},
	}
	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}
	handler := &QueryHandler{
		resolver: resolver,
		log:      zap.NewNop(),
		preparedPlan: &plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{},
		},
		pool:                   pool.New(),
		operation:              operation,
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpolateNothing,
		jsonStringInterpolator: interpolateNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
		queryParamsAllowList:   []string{"id"},
		hooksPipeline:          newPipeline(resolver, operation),
		liveQuery: liveQueryConfig{
			enabled:                true,
			pollingIntervalSeconds: 1,
		},
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	u, err := url.Parse(srv.URL)
	assert.NoError(t, err)
	query := u.Query()
	query.Set("id", "123")
	query.Set("wg_live", "")
	u.RawQuery = query.Encode()

	outURL := u.String()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, outURL, nil)
	assert.NoError(t, err)

	res, err := srv.Client().Do(req)
	assert.NoError(t, err)
	defer res.Body.Close()

	data, err := io.ReadAll(res.Body)
	assert.Equal(t, context.DeadlineExceeded, err)
	assert.Equal(t, "{\"data\":{\"me\":{\"name\":\"Jens\",\"counter\":0}}}\n\n{\"data\":{\"me\":{\"name\":\"Jens\",\"counter\":1}}}\n\n{\"data\":{\"me\":{\"name\":\"Jens\",\"counter\":2}}}\n\n", string(data))
	assert.True(t, validateCalled.Load())
}

func TestQueryHandler_LiveQueryJsonPatch(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

	validateNothing, err := inputvariables.NewValidator(inputSchema, true)
	assert.NoError(t, err)

	var validateCalled atomic.Bool
	counter := 0

	resolver := &FakeResolver{
		resolve: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) []byte {
			defer func() {
				counter++
			}()
			return []byte(`{"data":{"me":{"name":"Jens","bio":"Founder & CEO of WunderGraph","counter":` + strconv.Itoa(counter) + `}}}`)
		},
		validate: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) {
			assert.Equal(t, `{"id":123}`, string(ctx.Variables))
			validateCalled.Store(true)
		},
	}
	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}
	handler := &QueryHandler{
		resolver: resolver,
		log:      zap.NewNop(),
		preparedPlan: &plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{},
		},
		pool:                   pool.New(),
		operation:              operation,
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpolateNothing,
		jsonStringInterpolator: interpolateNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
		queryParamsAllowList:   []string{"id"},
		hooksPipeline:          newPipeline(resolver, operation),
		liveQuery: liveQueryConfig{
			enabled:                true,
			pollingIntervalSeconds: 1,
		},
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	u, err := url.Parse(srv.URL)
	assert.NoError(t, err)
	query := u.Query()
	query.Set("id", "123")
	query.Set("wg_live", "")
	query.Set("wg_json_patch", "")
	u.RawQuery = query.Encode()

	outURL := u.String()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, outURL, nil)
	assert.NoError(t, err)

	res, err := srv.Client().Do(req)
	assert.NoError(t, err)
	defer res.Body.Close()

	data, err := io.ReadAll(res.Body)
	assert.Equal(t, context.DeadlineExceeded, err)
	assert.Equal(t, "{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":0}}}\n\n[{\"value\":1,\"op\":\"replace\",\"path\":\"/data/me/counter\"}]\n\n[{\"value\":2,\"op\":\"replace\",\"path\":\"/data/me/counter\"}]\n\n", string(data))
	assert.True(t, validateCalled.Load())
}

func TestQueryHandler_SubscriptionJsonPatch(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

	validateNothing, err := inputvariables.NewValidator(inputSchema, true)
	assert.NoError(t, err)

	resolver := &FakeSubscriptionResolver{
		resolve: func(ctx *resolve.Context, subscription *resolve.GraphQLSubscription, writer resolve.FlushWriter) (err error) {
			for i := 0; i < 3; i++ {
				_, err = writer.Write([]byte(`{"data":{"me":{"name":"Jens","bio":"Founder & CEO of WunderGraph","counter":` + strconv.Itoa(i) + `}}}`))
				if err != nil {
					return err
				}
				writer.Flush()
			}
			return nil
		},
	}
	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}
	hooksClient := hooks.NewClient(&hooks.ClientOptions{
		ServerURL: "http://localhost:8080",
		Logger:    zap.NewNop(),
	})
	hooksPipelineCommonConfig := hooks.PipelineConfig{
		Client:    hooksClient,
		Operation: operation,
		Logger:    zap.NewNop(),
	}
	hooksPipelineConfig := hooks.SubscriptionOperationPipelineConfig{
		PipelineConfig: hooksPipelineCommonConfig,
		Resolver:       resolver,
		Plan:           &plan.SubscriptionResponsePlan{},
	}
	hooksPipeline := hooks.NewSubscriptionOperationPipeline(hooksPipelineConfig)
	handler := &SubscriptionHandler{
		resolver:               resolver,
		log:                    zap.NewNop(),
		preparedPlan:           &plan.SubscriptionResponsePlan{},
		pool:                   pool.New(),
		operation:              operation,
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpolateNothing,
		jsonStringInterpolator: interpolateNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
		queryParamsAllowList:   []string{"id"},
		hooksPipeline:          hooksPipeline,
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	u, err := url.Parse(srv.URL)
	assert.NoError(t, err)
	query := u.Query()
	query.Set("id", "123")
	query.Set("wg_live", "")
	query.Set("wg_json_patch", "")
	u.RawQuery = query.Encode()

	outURL := u.String()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, outURL, nil)
	assert.NoError(t, err)

	res, err := srv.Client().Do(req)
	defer res.Body.Close()
	assert.NoError(t, err)

	data, err := io.ReadAll(res.Body)
	assert.NoError(t, err)
	assert.Equal(t, "{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":0}}}\n\n[{\"value\":1,\"op\":\"replace\",\"path\":\"/data/me/counter\"}]\n\n[{\"value\":2,\"op\":\"replace\",\"path\":\"/data/me/counter\"}]\n\n", string(data))
}

func TestQueryHandler_Subscription(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

	validateNothing, err := inputvariables.NewValidator(inputSchema, true)
	assert.NoError(t, err)

	resolver := &FakeSubscriptionResolver{
		resolve: func(ctx *resolve.Context, subscription *resolve.GraphQLSubscription, writer resolve.FlushWriter) (err error) {
			for i := 0; i < 3; i++ {
				_, err = writer.Write([]byte(`{"data":{"me":{"name":"Jens","bio":"Founder & CEO of WunderGraph","counter":` + strconv.Itoa(i) + `}}}`))
				if err != nil {
					return err
				}
				writer.Flush()
			}
			return nil
		},
	}
	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}
	hooksClient := hooks.NewClient(&hooks.ClientOptions{
		ServerURL: "http://localhost:8080",
		Logger:    zap.NewNop(),
	})
	hooksPipelineCommonConfig := hooks.PipelineConfig{
		Client:    hooksClient,
		Operation: operation,
		Logger:    zap.NewNop(),
	}
	hooksPipelineConfig := hooks.SubscriptionOperationPipelineConfig{
		PipelineConfig: hooksPipelineCommonConfig,
		Resolver:       resolver,
		Plan:           &plan.SubscriptionResponsePlan{},
	}
	hooksPipeline := hooks.NewSubscriptionOperationPipeline(hooksPipelineConfig)
	handler := &SubscriptionHandler{
		resolver:               resolver,
		log:                    zap.NewNop(),
		preparedPlan:           &plan.SubscriptionResponsePlan{},
		pool:                   pool.New(),
		operation:              operation,
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpolateNothing,
		jsonStringInterpolator: interpolateNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
		queryParamsAllowList:   []string{"id"},
		hooksPipeline:          hooksPipeline,
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	u, err := url.Parse(srv.URL)
	assert.NoError(t, err)
	query := u.Query()
	query.Set("id", "123")
	query.Set("wg_live", "")
	// query.Set("wg_json_patch", "") disable json patch mode
	u.RawQuery = query.Encode()

	outURL := u.String()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, outURL, nil)
	assert.NoError(t, err)

	res, err := srv.Client().Do(req)
	assert.NoError(t, err)
	defer res.Body.Close()

	data, err := io.ReadAll(res.Body)
	assert.NoError(t, err)
	assert.Equal(t, "{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":0}}}\n\n{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":1}}}\n\n{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":2}}}\n\n", string(data))
}

func TestFunctionsHandler_Default(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

	validateNothing, err := inputvariables.NewValidator(inputSchema, true)
	assert.NoError(t, err)

	hookServerRequestCount := 0

	fakeHookServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"response":{"data":{"me":{"name":"Jens","bio":"Founder & CEO of WunderGraph","counter":0}}}}`))
		hookServerRequestCount++
	}))

	defer fakeHookServer.Close()

	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}
	hooksClient := hooks.NewClient(&hooks.ClientOptions{
		ServerURL: fakeHookServer.URL,
		Logger:    zap.NewNop(),
	})
	handler := &FunctionsHandler{
		log:                  zap.NewNop(),
		operation:            operation,
		rbacEnforcer:         &authentication.RBACEnforcer{},
		stringInterpolator:   interpolateNothing,
		variablesValidator:   validateNothing,
		queryParamsAllowList: []string{"id"},
		liveQuery: liveQueryConfig{
			enabled:                true,
			pollingIntervalSeconds: 1,
		},
		hooksClient: hooksClient,
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	u, err := url.Parse(srv.URL)
	assert.NoError(t, err)
	query := u.Query()
	query.Set("id", "123")
	u.RawQuery = query.Encode()

	outURL := u.String()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, outURL, nil)
	assert.NoError(t, err)

	res, err := srv.Client().Do(req)
	assert.NoError(t, err)
	defer res.Body.Close()

	data, err := io.ReadAll(res.Body)
	assert.NoError(t, err)
	assert.Equal(t, "{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":0}}}", string(data))
	assert.Equal(t, 1, hookServerRequestCount)
}

func TestFunctionsHandler_Live(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

	validateNothing, err := inputvariables.NewValidator(inputSchema, true)
	assert.NoError(t, err)

	var hookServerRequestCount atomic.Int64

	fakeHookServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		count := int(hookServerRequestCount.Load())
		_, _ = w.Write([]byte(`{"response":{"data":{"me":{"name":"Jens","bio":"Founder & CEO of WunderGraph","counter":` + strconv.Itoa(count) + `}}}}`))
		hookServerRequestCount.Add(1)
	}))

	defer fakeHookServer.Close()

	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}
	hooksClient := hooks.NewClient(&hooks.ClientOptions{
		ServerURL: fakeHookServer.URL,
		Logger:    zap.NewNop(),
	})
	handler := &FunctionsHandler{
		log:                  zap.NewNop(),
		operation:            operation,
		rbacEnforcer:         &authentication.RBACEnforcer{},
		stringInterpolator:   interpolateNothing,
		variablesValidator:   validateNothing,
		queryParamsAllowList: []string{"id"},
		liveQuery: liveQueryConfig{
			enabled:                true,
			pollingIntervalSeconds: 1,
		},
		hooksClient: hooksClient,
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	u, err := url.Parse(srv.URL)
	assert.NoError(t, err)
	query := u.Query()
	query.Set("id", "123")
	query.Set("wg_live", "")
	u.RawQuery = query.Encode()

	outURL := u.String()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, outURL, nil)
	assert.NoError(t, err)

	res, err := srv.Client().Do(req)
	assert.NoError(t, err)
	defer res.Body.Close()

	data, err := io.ReadAll(res.Body)
	assert.Equal(t, context.DeadlineExceeded, err)
	assert.Equal(t, "{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":0}}}\n\n{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":1}}}\n\n{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":2}}}\n\n", string(data))
	assert.Equal(t, 3, int(hookServerRequestCount.Load()))
}

func TestFunctionsHandler_Live_JSONPatch(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

	validateNothing, err := inputvariables.NewValidator(inputSchema, true)
	assert.NoError(t, err)

	hookServerRequestCount := 0

	fakeHookServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"response":{"data":{"me":{"name":"Jens","bio":"Founder & CEO of WunderGraph","counter":` + strconv.Itoa(hookServerRequestCount) + `}}}}`))
		hookServerRequestCount++
	}))

	defer fakeHookServer.Close()

	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}
	hooksClient := hooks.NewClient(&hooks.ClientOptions{
		ServerURL: fakeHookServer.URL,
		Logger:    zap.NewNop(),
	})
	handler := &FunctionsHandler{
		log:                  zap.NewNop(),
		operation:            operation,
		rbacEnforcer:         &authentication.RBACEnforcer{},
		stringInterpolator:   interpolateNothing,
		variablesValidator:   validateNothing,
		queryParamsAllowList: []string{"id"},
		liveQuery: liveQueryConfig{
			enabled:                true,
			pollingIntervalSeconds: 1,
		},
		hooksClient: hooksClient,
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	u, err := url.Parse(srv.URL)
	assert.NoError(t, err)
	query := u.Query()
	query.Set("id", "123")
	query.Set("wg_live", "")
	query.Set("wg_json_patch", "")
	u.RawQuery = query.Encode()

	outURL := u.String()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, outURL, nil)
	assert.NoError(t, err)

	res, err := srv.Client().Do(req)
	assert.NoError(t, err)
	defer res.Body.Close()

	data, err := io.ReadAll(res.Body)
	assert.Equal(t, context.DeadlineExceeded, err)
	assert.Equal(t, "{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":0}}}\n\n[{\"value\":1,\"op\":\"replace\",\"path\":\"/data/me/counter\"}]\n\n[{\"value\":2,\"op\":\"replace\",\"path\":\"/data/me/counter\"}]\n\n", string(data))
	assert.Equal(t, 3, hookServerRequestCount)
}

func TestFunctionsHandler_Subscription(t *testing.T) {
	testCases := []struct {
		Name   string
		URL    string
		Expect string
	}{
		{
			Name:   "plain",
			URL:    "/jens?id=123",
			Expect: "{\"response\":{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":0}}}}\n\n{\"response\":{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":1}}}}\n\n{\"response\":{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":2}}}}\n\n",
		},
		{
			Name:   "json-patch",
			URL:    "/jens?id=123&wg_json_patch",
			Expect: "{\"response\":{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":0}}}}\n\n[{\"value\":1,\"op\":\"replace\",\"path\":\"/response/data/me/counter\"}]\n\n[{\"value\":2,\"op\":\"replace\",\"path\":\"/response/data/me/counter\"}]\n\n",
		},
		{
			Name:   "json-patch-sse",
			URL:    "/jens?id=123&wg_json_patch&wg_sse",
			Expect: "data: {\"response\":{\"data\":{\"me\":{\"name\":\"Jens\",\"bio\":\"Founder & CEO of WunderGraph\",\"counter\":0}}}}\n\ndata: [{\"value\":1,\"op\":\"replace\",\"path\":\"/response/data/me/counter\"}]\n\ndata: [{\"value\":2,\"op\":\"replace\",\"path\":\"/response/data/me/counter\"}]\n\nevent: done\n\n",
		},
		{
			Name:   "ping",
			URL:    "/ping?id=456",
			Expect: "{\"response\":{\"data\":{\"n\":0}}}\n\n{\"response\":{\"data\":{\"n\":1}}}\n\n\n{\"response\":{\"data\":{\"n\":2}}}\n\n",
		},
	}
	const pingInterval = 50 * time.Millisecond

	for _, tc := range testCases {
		tc := tc
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()

			interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
			assert.NoError(t, err)

			inputSchema := `{"type":"object","properties":{"id":{"type":"number"}}}`

			validateNothing, err := inputvariables.NewValidator(inputSchema, true)
			assert.NoError(t, err)

			hookServerRequestCount := 0

			isPing := strings.HasPrefix(tc.URL, "/ping")

			fakeHookServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				switch {
				default:
					for i := 0; i < 3; i++ {
						_, _ = w.Write([]byte(`{"response":{"data":{"me":{"name":"Jens","bio":"Founder & CEO of WunderGraph","counter":` + strconv.Itoa(hookServerRequestCount) + `}}}}`))
						_, _ = w.Write([]byte("\n\n"))
						w.(http.Flusher).Flush()
						hookServerRequestCount++
					}
				case isPing:
					for i := 0; i < 3; i++ {
						_, _ = w.Write([]byte(fmt.Sprintf(`{"response":{"data":{"n":%d}}}`, i)))
						_, _ = w.Write([]byte("\n\n"))
						w.(http.Flusher).Flush()
						hookServerRequestCount++
						switch i {
						case 0:
							// Sleep half the ping interval, should not include ping
							time.Sleep(pingInterval / 2)
						case 1:
							// Sleep for the ping interval + 50ms, should include a single ping
							time.Sleep(pingInterval/2 + 50*time.Millisecond)
						}
					}
				}
			}))

			defer fakeHookServer.Close()

			operation := &wgpb.Operation{
				Name:          "test",
				OperationType: wgpb.OperationType_SUBSCRIPTION,
			}
			hooksClient := hooks.NewClient(&hooks.ClientOptions{
				ServerURL: fakeHookServer.URL,
				Logger:    zap.NewNop(),
			})
			handler := &FunctionsHandler{
				log:                  zap.NewNop(),
				operation:            operation,
				rbacEnforcer:         &authentication.RBACEnforcer{},
				stringInterpolator:   interpolateNothing,
				variablesValidator:   validateNothing,
				queryParamsAllowList: []string{"id"},
				liveQuery: liveQueryConfig{
					enabled:                true,
					pollingIntervalSeconds: 1,
				},
				hooksClient:  hooksClient,
				pingInterval: pingInterval,
			}

			srv := httptest.NewServer(handler)
			defer srv.Close()

			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			defer cancel()

			u, err := url.Parse(srv.URL)
			assert.NoError(t, err)

			outURL, err := u.Parse(tc.URL)
			assert.NoError(t, err)

			req, err := http.NewRequestWithContext(ctx, http.MethodGet, outURL.String(), nil)
			assert.NoError(t, err)

			res, err := srv.Client().Do(req)
			assert.NoError(t, err)

			data, err := io.ReadAll(res.Body)
			assert.NoError(t, err)
			assert.Equal(t, tc.Expect, string(data))
			assert.Equal(t, 3, hookServerRequestCount)

		})
	}
}

func TestQueryHandler_Caching(t *testing.T) {

	interpolateNothing, err := interpolate.NewStringInterpolator(`{}`)
	assert.NoError(t, err)

	validateNothing, err := inputvariables.NewValidator(`{"type":"object","properties":{"id":{"type":"number"}}}`, true)
	assert.NoError(t, err)

	resolver := &FakeResolver{
		resolve: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) []byte {
			return []byte(`{"data":{"me":{"name":"Jens"}}}`)
		},
	}
	operation := &wgpb.Operation{
		Name:          "test",
		OperationType: wgpb.OperationType_QUERY,
	}

	handler := &QueryHandler{
		resolver: resolver,
		log:      zap.NewNop(),
		preparedPlan: &plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{},
		},
		pool: pool.New(),
		cacheHeaders: cacheheaders.New(&cacheheaders.CacheControl{
			MaxAge:               2,
			Public:               true,
			StaleWhileRevalidate: 0,
		}, ""),
		operation:              operation,
		rbacEnforcer:           &authentication.RBACEnforcer{},
		stringInterpolator:     interpolateNothing,
		jsonStringInterpolator: interpolateNothing,
		variablesValidator:     validateNothing,
		postResolveTransformer: &postresolvetransform.Transformer{},
		hooksPipeline:          newPipeline(resolver, operation),
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
	res.Body().Equal(`{"data":{"me":{"name":"Jens"}}}`)

	handler.cacheHeaders = cacheheaders.New(&cacheheaders.CacheControl{
		MaxAge:               2,
		Public:               false,
		StaleWhileRevalidate: 0,
	}, "")

	time.Sleep(time.Second)

	res = e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		Expect()

	res.Status(http.StatusOK)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Headers().ValueEqual("Cache-Control", []string{"private, max-age=2, stale-while-revalidate=0"})
	res.Headers().ValueEqual("Age", []string{"0"})
	res.Body().Equal(`{"data":{"me":{"name":"Jens"}}}`)

	assert.Equal(t, 2, resolver.invocations)

	res = e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		WithHeader("If-None-Match", "W/\"15825766644480138524\"").
		Expect()

	res.Status(http.StatusNotModified)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Headers().ValueEqual("Cache-Control", []string{"private, max-age=2, stale-while-revalidate=0"})
	res.Headers().ValueEqual("Age", []string{"0"})
	res.Body().Empty()

	time.Sleep(time.Second * 2)

	res = e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		Expect()

	res.Status(http.StatusOK)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Headers().ValueEqual("Cache-Control", []string{"private, max-age=2, stale-while-revalidate=0"})
	res.Headers().ValueEqual("Age", []string{"0"})
	res.Body().Equal(`{"data":{"me":{"name":"Jens"}}}`)

	assert.Equal(t, 4, resolver.invocations)

	time.Sleep(time.Second)

	res = e.GET("/api/main").
		WithQuery("wg_variables", `{"id":123}`).
		WithHeader("If-None-Match", "W/\"15825766644480138524\"").
		Expect()

	res.Status(http.StatusNotModified)
	res.Headers().ValueEqual("Etag", []string{"W/\"15825766644480138524\""})
	res.Headers().ValueEqual("Cache-Control", []string{"private, max-age=2, stale-while-revalidate=0"})
	res.Headers().ValueEqual("Age", []string{"0"})
	res.Body().Empty()

	assert.Equal(t, 5, resolver.invocations)
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
