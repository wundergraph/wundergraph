package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"

	"github.com/wundergraph/wundergraph/examples/schema-extension/server/graph/generated"
	"github.com/wundergraph/wundergraph/examples/schema-extension/server/graph/model"
)

// Images is the resolver for the images field.
func (r *queryResolver) Images(ctx context.Context) ([]*model.Image, error) {
	return []*model.Image{
		{
			ID:   "1",
			Name: "Image 1",
			Geography: map[string]interface{}{
				"latitude":  52.520008,
				"longitude": 13.404954,
			},
		},
		{
			ID:   "2",
			Name: "Image 2",
			Geography: map[string]interface{}{
				"latitude":  72.670000,
				"longitude": 11.308932,
			},
		},
	}, nil
}

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type queryResolver struct{ *Resolver }
