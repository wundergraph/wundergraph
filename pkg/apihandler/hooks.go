package apihandler

import (
	"bytes"
	"net/http"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
	"github.com/wundergraph/wundergraph/pkg/hooks"
)

type operationHooksResolver struct {
	resolver QueryResolver
	plan     *plan.SynchronousResponsePlan
}

func (r *operationHooksResolver) Resolve(ctx *resolve.Context, w http.ResponseWriter, buf *bytes.Buffer) error {
	return r.resolver.ResolveGraphQLResponse(ctx, r.plan.Response, nil, buf)
}

func newOperationHooksResolver(r QueryResolver, plan *plan.SynchronousResponsePlan) hooks.Resolver {
	return &operationHooksResolver{
		resolver: r,
		plan:     plan,
	}
}

type subscriptionHooksResolver struct {
	resolver *resolve.Resolver
	plan     *plan.SubscriptionResponsePlan
}

func (r *subscriptionHooksResolver) Resolve(ctx *resolve.Context, w http.ResponseWriter, buf *bytes.Buffer) error {
	flushWriter := w.(resolve.FlushWriter)
	return r.resolver.ResolveGraphQLSubscription(ctx, r.plan.Response, flushWriter)
}

func newSubscriptionHooksResolver(r *resolve.Resolver, plan *plan.SubscriptionResponsePlan) hooks.Resolver {
	return &subscriptionHooksResolver{
		resolver: r,
		plan:     plan,
	}
}
