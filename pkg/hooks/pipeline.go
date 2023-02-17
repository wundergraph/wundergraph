package hooks

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"

	"go.uber.org/zap"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
	"github.com/wundergraph/graphql-go-tools/pkg/lexer/literal"

	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/postresolvetransform"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Authenticator func(ctx context.Context) (user interface{})

type SubscriptionWriter interface {
	http.ResponseWriter
	resolve.FlushWriter
}

type QueryResolver interface {
	ResolveGraphQLResponse(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte, writer io.Writer) (err error)
}

type ResolveConfiguration struct {
	// Pre indicates wheter the PreResolve hook should be run
	Pre bool
	// MutatingPre indicates wheter the MutatingPreResolve hook should be run
	MutatingPre bool
	// Custom indicates wheter the CustomResolve hook should be run
	Custom bool
	// Mock indicates wether the MockResolve hook should be run
	Mock bool
}

type PostResolveConfiguration struct {
	// Post indicates wether the PostResolve hook should be run
	Post bool
	// MutatingPost indicates wether the MutatingPostResolve hook should be run
	MutatingPost bool
}

type Response struct {
	Done     bool
	Resolved bool
	Data     []byte
}

type PipelineConfig struct {
	Client        *Client
	Authenticator Authenticator
	Operation     *wgpb.Operation
	Transformer   *postresolvetransform.Transformer
	Logger        *zap.Logger
}

type SynchronousOperationPipelineConfig struct {
	PipelineConfig
	Resolver QueryResolver
	Plan     *plan.SynchronousResponsePlan
}

type SubscriptionOperationPipelineConfig struct {
	PipelineConfig
	Resolver *resolve.Resolver
	Plan     *plan.SubscriptionResponsePlan
}

type pipeline struct {
	client                 *Client
	logger                 *zap.Logger
	operation              *wgpb.Operation
	postResolveTransformer *postresolvetransform.Transformer
	authenticator          Authenticator
	ResolveConfig          ResolveConfiguration
	PostResolveConfig      PostResolveConfiguration
}

func newPipeline(config PipelineConfig) pipeline {
	hooksConfig := config.Operation.GetHooksConfiguration()

	return pipeline{
		client:                 config.Client,
		logger:                 config.Logger,
		operation:              config.Operation,
		postResolveTransformer: config.Transformer,
		authenticator:          config.Authenticator,
		ResolveConfig: ResolveConfiguration{
			Pre:         hooksConfig.GetPreResolve(),
			MutatingPre: hooksConfig.GetMutatingPreResolve(),
			Custom:      hooksConfig.GetCustomResolve(),
			// TODO: Mock hook seems to support some extra configuration
			Mock: hooksConfig.GetMockResolve().GetEnable(),
		},
		PostResolveConfig: PostResolveConfiguration{
			Post:         hooksConfig.GetPostResolve(),
			MutatingPost: hooksConfig.GetMutatingPostResolve(),
		},
	}
}

func NewSynchonousOperationPipeline(config SynchronousOperationPipelineConfig) *SynchronousOperationPipeline {

	return &SynchronousOperationPipeline{
		pipeline: newPipeline(config.PipelineConfig),
		resolver: config.Resolver,
		plan:     config.Plan,
	}
}

func NewSubscriptionOperationPipeline(config SubscriptionOperationPipelineConfig) *SubscriptionOperationPipeline {
	return &SubscriptionOperationPipeline{
		pipeline: newPipeline(config.PipelineConfig),
		resolver: config.Resolver,
		plan:     config.Plan,
	}
}

func (p *pipeline) updateContextHeaders(ctx *resolve.Context, headers map[string]string) {
	if len(headers) == 0 {
		return
	}
	httpHeader := http.Header{}
	for name := range headers {
		httpHeader.Set(name, headers[name])
	}
	ctx.Request.Header = httpHeader
	clientRequest := ctx.Context.Value(pool.ClientRequestKey)
	if clientRequest == nil {
		return
	}
	if cr, ok := clientRequest.(*http.Request); ok {
		cr.Header = httpHeader
	}
}

func (p *pipeline) handleHookResponse(ctx *resolve.Context, w http.ResponseWriter, hook MiddlewareHook, resp *MiddlewareHookResponse) (done bool) {
	if resp == nil {
		p.logger.Error(fmt.Sprintf("hook %s failed", hook),
			zap.String("operationName", p.operation.Name),
			zap.String("operationType", p.operation.OperationType.String()),
		)
		if w != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			if flusher, ok := w.(http.Flusher); ok {
				flusher.Flush()
			}
		}
		return true
	}
	p.updateContextHeaders(ctx, resp.SetClientRequestHeaders)
	return false
}

// PreResolve runs the pre-resolution hooks
func (p *pipeline) PreResolve(ctx *resolve.Context, w http.ResponseWriter, r *http.Request) (*Response, error) {
	// XXX: Errors returned by Client.DoOperationRequest() already contain the hook name, do not reannotate them!
	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	var resp *MiddlewareHookResponse
	var err error
	data := ctx.Variables
	if p.ResolveConfig.Pre {
		hookData := EncodeData(p.authenticator, r, hookBuf.Bytes(), data, nil)
		resp, err = p.client.DoOperationRequest(ctx.Context, p.operation.Name, PreResolve, hookData)
		if err != nil {
			return nil, err
		}
		if done := p.handleHookResponse(ctx, w, PreResolve, resp); done {
			return &Response{
				Done: true,
			}, nil
		}
	}

	if p.ResolveConfig.MutatingPre {
		hookData := EncodeData(p.authenticator, r, hookBuf.Bytes(), data, nil)
		resp, err = p.client.DoOperationRequest(ctx.Context, p.operation.Name, MutatingPreResolve, hookData)
		if err != nil {
			return nil, err
		}
		if done := p.handleHookResponse(ctx, w, MutatingPreResolve, resp); done {
			return &Response{
				Done: true,
			}, nil
		}
		// Update data with what the hook returned
		// XXX: mutatingPreResolve returns the data in resp.Input
		data = resp.Input
	}

	if p.ResolveConfig.Mock {
		hookData := EncodeData(p.authenticator, r, hookBuf.Bytes(), data, nil)
		resp, err := p.client.DoOperationRequest(ctx.Context, p.operation.Name, MockResolve, hookData)
		if err != nil {
			return nil, err
		}
		if done := p.handleHookResponse(ctx, w, MutatingPreResolve, resp); done {
			return &Response{
				Done: true,
			}, nil
		}
		// MockResolve returned data is used unconditionally
		return &Response{
			Resolved: true,
			Data:     resp.Response,
		}, nil
	}

	if p.ResolveConfig.Custom {
		hookData := EncodeData(p.authenticator, r, hookBuf.Bytes(), data, nil)
		resp, err = p.client.DoOperationRequest(ctx.Context, p.operation.Name, CustomResolve, hookData)
		if err != nil {
			return nil, err
		}
		if done := p.handleHookResponse(ctx, w, CustomResolve, resp); done {
			return &Response{
				Done: true,
			}, nil
		}
		// the customResolve hook can indicate to "skip" by responding with "null"
		// so, we only write the response if it's not null
		// XXX: customResolve returns the data in resp.Response
		if !bytes.Equal(resp.Response, literal.NULL) {
			return &Response{
				Resolved: true,
				Data:     resp.Response,
			}, nil
		}
	}

	return &Response{Data: data}, nil
}

// PostResolve runs the post-resolution hooks
func (p *pipeline) PostResolve(ctx *resolve.Context, w http.ResponseWriter, r *http.Request, responseData []byte) (*Response, error) {

	// XXX: Errors returned by Client.DoOperationRequest() already contain the hook name, do not reannotate them!
	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	if p.PostResolveConfig.Post {
		postResolveData := EncodeData(p.authenticator, r, hookBuf.Bytes(), ctx.Variables, responseData)
		resp, err := p.client.DoOperationRequest(ctx.Context, p.operation.Name, PostResolve, postResolveData)
		if err != nil {
			return nil, err
		}
		if done := p.handleHookResponse(ctx, w, CustomResolve, resp); done {
			return &Response{
				Done: true,
			}, nil
		}
	}

	if p.PostResolveConfig.MutatingPost {
		mutatingPostData := EncodeData(p.authenticator, r, hookBuf.Bytes(), ctx.Variables, responseData)
		resp, err := p.client.DoOperationRequest(ctx.Context, p.operation.Name, MutatingPostResolve, mutatingPostData)
		if err != nil {
			return nil, err
		}
		if done := p.handleHookResponse(ctx, w, CustomResolve, resp); done {
			return &Response{
				Done: true,
			}, nil
		}
		responseData = resp.Response
	}

	return &Response{
		Data: responseData,
	}, nil
}

type SynchronousOperationPipeline struct {
	pipeline
	resolver QueryResolver
	plan     *plan.SynchronousResponsePlan
}

// Run runs the pre-resolution hooks, resolves the operation if needed and then runs the post-resolution
// hooks. The pipeline Resolver must implement ResolveOperation.
func (p *SynchronousOperationPipeline) Run(ctx *resolve.Context, w http.ResponseWriter, r *http.Request, buf *bytes.Buffer) (*Response, error) {
	preResolveResp, err := p.PreResolve(ctx, w, r)
	if err != nil {
		return nil, fmt.Errorf("preResolve hooks failed: %w", err)
	}
	if preResolveResp.Done {
		return preResolveResp, nil
	}

	variables := ctx.Variables
	ctx.Variables = preResolveResp.Data

	if preResolveResp.Resolved {
		_, err = io.Copy(buf, bytes.NewReader(ctx.Variables))
	} else {
		err = p.resolver.ResolveGraphQLResponse(ctx, p.plan.Response, nil, buf)
	}

	// Restore ctx.Variables, since ctx might be reused for live queries
	ctx.Variables = variables

	if err != nil {
		return nil, fmt.Errorf("ResolveGraphQLResponse failed: %w", err)
	}

	var response []byte
	if p.postResolveTransformer != nil {
		response, err = p.postResolveTransformer.Transform(buf.Bytes())
		if err != nil {
			return nil, fmt.Errorf("postResolveTransformer failed: %w", err)
		}
	} else {
		response = buf.Bytes()
	}

	postResolveResp, err := p.PostResolve(ctx, w, r, response)
	if err != nil {
		return nil, fmt.Errorf("postResolve hooks failed: %w", err)
	}

	if postResolveResp.Done {
		return postResolveResp, nil
	}

	return &Response{
		Data: postResolveResp.Data,
	}, nil
}

type SubscriptionOperationPipeline struct {
	pipeline
	resolver *resolve.Resolver
	plan     *plan.SubscriptionResponsePlan
}

// Run runs the pre-resolution hooks and resolves the subscription if needed. The writer is responsible for
// calling the post-resolution hooks (usually via Pipeline.PostResolve()). The pipeline Resolver must implement
// ResolveSubscription.
func (p *SubscriptionOperationPipeline) RunSubscription(ctx *resolve.Context, w SubscriptionWriter, r *http.Request) (*Response, error) {
	preResolveResp, err := p.PreResolve(ctx, w, r)
	if err != nil {
		return nil, fmt.Errorf("preResolve hooks failed: %w", err)
	}

	if preResolveResp.Done {
		return preResolveResp, nil
	}

	if preResolveResp.Resolved {
		_, err = w.Write(preResolveResp.Data)
	} else {
		variables := ctx.Variables
		ctx.Variables = preResolveResp.Data
		err = p.resolver.ResolveGraphQLSubscription(ctx, p.plan.Response, w)
		// Restore ctx.Variables, since ctx might be reused
		ctx.Variables = variables
	}

	if err != nil {
		return nil, fmt.Errorf("ResolveGraphQLResponse failed: %w", err)
	}

	return &Response{
		Done: true,
	}, nil
}
