package hooks

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
	"github.com/wundergraph/graphql-go-tools/pkg/lexer/literal"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/postresolvetransform"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
	"go.uber.org/zap"
)

type Authenticator func(ctx context.Context) (user interface{})

type Resolver interface {
	Resolve(ctx *resolve.Context, w http.ResponseWriter, buf *bytes.Buffer) error
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

type Pipeline struct {
	client                 *Client
	logger                 *zap.Logger
	operation              *wgpb.Operation
	resolver               Resolver
	preparedPlan           *plan.SynchronousResponsePlan
	postResolveTransformer *postresolvetransform.Transformer
	authenticator          Authenticator
	ResolveConfig          ResolveConfiguration
	PostResolveConfig      PostResolveConfiguration
}

func NewPipeline(client *Client, authenticator Authenticator, operation *wgpb.Operation, resolver Resolver, transformer *postresolvetransform.Transformer, logger *zap.Logger) *Pipeline {
	hooksConfig := operation.GetHooksConfiguration()

	return &Pipeline{
		client:                 client,
		logger:                 logger,
		operation:              operation,
		resolver:               resolver,
		postResolveTransformer: transformer,
		authenticator:          authenticator,
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

func (p *Pipeline) updateContextHeaders(ctx *resolve.Context, headers map[string]string) {
	// TODO!
}

func (p *Pipeline) handleHookResponse(ctx *resolve.Context, w http.ResponseWriter, hook MiddlewareHook, resp *MiddlewareHookResponse) (done bool) {
	if resp == nil {
		p.logger.Error(fmt.Sprintf("hook %s failed", hook),
			zap.String("operationName", p.operation.Name),
			zap.String("operationType", p.operation.OperationType.String()),
		)
		if w != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return true
	}
	p.updateContextHeaders(ctx, resp.SetClientRequestHeaders)
	return false
}

func (p *Pipeline) PreResolve(ctx *resolve.Context, w http.ResponseWriter, r *http.Request) (*Response, error) {
	// XXX: Errors returned by Client.DoOperationRequest() already contain the hook name, do not reannotate them!
	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	var resp *MiddlewareHookResponse
	var err error
	if p.ResolveConfig.Pre {
		hookData := EncodeData(p.authenticator, r, hookBuf.Bytes(), ctx.Variables, nil)
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
		hookData := EncodeData(p.authenticator, r, hookBuf.Bytes(), ctx.Variables, nil)
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
		ctx.Variables = resp.Input
	}

	if p.ResolveConfig.Mock {
		hookData := EncodeData(p.authenticator, r, hookBuf.Bytes(), ctx.Variables, nil)
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
		hookData := EncodeData(p.authenticator, r, hookBuf.Bytes(), ctx.Variables, nil)
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

	return &Response{Data: ctx.Variables}, nil
}

func (p *Pipeline) PostResolve(ctx *resolve.Context, w http.ResponseWriter, r *http.Request, responseData []byte) (*Response, error) {

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

func (p *Pipeline) Run(ctx *resolve.Context, w http.ResponseWriter, r *http.Request, buf *bytes.Buffer) (*Response, error) {
	preResolveResp, err := p.PreResolve(ctx, w, r)
	if err != nil {
		return nil, fmt.Errorf("preResolve hooks failed: %w", err)
	}
	if preResolveResp.Done {
		return preResolveResp, nil
	}

	ctx.Variables = preResolveResp.Data

	if preResolveResp.Resolved {
		_, err = io.Copy(buf, bytes.NewReader(ctx.Variables))
	} else {
		err = p.resolver.Resolve(ctx, w, buf)
	}

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
		Data: response,
	}, nil
}
