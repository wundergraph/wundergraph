package apihandler

import (
	"bytes"
	"errors"
	"net/http"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"

	"github.com/wundergraph/wundergraph/pkg/hooks"
)

type operationHooksResolver struct {
	resolver QueryResolver
	plan     *plan.SynchronousResponsePlan
}

func (r *operationHooksResolver) ResolveOperation(ctx *resolve.Context, w http.ResponseWriter, buf *bytes.Buffer) error {
	return r.resolver.ResolveGraphQLResponse(ctx, r.plan.Response, nil, buf)
}

func (r *operationHooksResolver) ResolveSubscription(ctx *resolve.Context, w hooks.SubscriptionWriter) error {
	return errors.New("can't resolve subscription")
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

func (r *subscriptionHooksResolver) ResolveOperation(ctx *resolve.Context, w http.ResponseWriter, buf *bytes.Buffer) error {
	return errors.New("can't resolve operation")
}

func (r *subscriptionHooksResolver) ResolveSubscription(ctx *resolve.Context, w hooks.SubscriptionWriter) error {
	return r.resolver.ResolveGraphQLSubscription(ctx, r.plan.Response, w)
}

func newSubscriptionHooksResolver(r *resolve.Resolver, plan *plan.SubscriptionResponsePlan) hooks.Resolver {
	return &subscriptionHooksResolver{
		resolver: r,
		plan:     plan,
	}
}
