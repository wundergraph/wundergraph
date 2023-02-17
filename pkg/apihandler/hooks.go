package apihandler

import (
	"bytes"
	"net/http"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"

	"github.com/wundergraph/wundergraph/pkg/hooks"
)

type synchronousOperationHooksResolver struct {
	resolver QueryResolver
	plan     *plan.SynchronousResponsePlan
}

func (r *synchronousOperationHooksResolver) ResolveSynchronousOperation(ctx *resolve.Context, w http.ResponseWriter, buf *bytes.Buffer) error {
	return r.resolver.ResolveGraphQLResponse(ctx, r.plan.Response, nil, buf)
}

func newSynchronousOperationHooksResolver(r QueryResolver, plan *plan.SynchronousResponsePlan) hooks.SynchronousOperationResolver {
	return &synchronousOperationHooksResolver{
		resolver: r,
		plan:     plan,
	}
}

type subscriptionOperationHooksResolver struct {
	resolver *resolve.Resolver
	plan     *plan.SubscriptionResponsePlan
}

func (r *subscriptionOperationHooksResolver) ResolveSubscriptionOperation(ctx *resolve.Context, w hooks.SubscriptionWriter) error {
	return r.resolver.ResolveGraphQLSubscription(ctx, r.plan.Response, w)
}

func newSubscriptionOperationHooksResolver(r *resolve.Resolver, plan *plan.SubscriptionResponsePlan) hooks.SubscriptionOperationResolver {
	return &subscriptionOperationHooksResolver{
		resolver: r,
		plan:     plan,
	}
}
