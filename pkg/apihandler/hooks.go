package apihandler

import (
	"bytes"
	"errors"
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

func (r *synchronousOperationHooksResolver) ResolveSubscriptionOperation(ctx *resolve.Context, w hooks.SubscriptionWriter) error {
	return errors.New("can't resolve subscription")
}

func newSynchronousOperationHooksResolver(r QueryResolver, plan *plan.SynchronousResponsePlan) hooks.Resolver {
	return &synchronousOperationHooksResolver{
		resolver: r,
		plan:     plan,
	}
}

type subscriptionOperationHooksResolver struct {
	resolver *resolve.Resolver
	plan     *plan.SubscriptionResponsePlan
}

func (r *subscriptionOperationHooksResolver) ResolveSynchronousOperation(ctx *resolve.Context, w http.ResponseWriter, buf *bytes.Buffer) error {
	return errors.New("can't resolve operation")
}

func (r *subscriptionOperationHooksResolver) ResolveSubscriptionOperation(ctx *resolve.Context, w hooks.SubscriptionWriter) error {
	return r.resolver.ResolveGraphQLSubscription(ctx, r.plan.Response, w)
}

func newSubscriptionOperationHooksResolver(r *resolve.Resolver, plan *plan.SubscriptionResponsePlan) hooks.Resolver {
	return &subscriptionOperationHooksResolver{
		resolver: r,
		plan:     plan,
	}
}
