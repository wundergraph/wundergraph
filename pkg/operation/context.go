package operation

import (
	"context"
	"net/http"
)

type contextKey string

const (
	contextKeyOperationMetadata = contextKey("operationMetaData")
)

// RequestWithMetadata returns a new *http.Request carrying the given Metadata
// in its Context().
func RequestWithMetadata(r *http.Request, metadata *Metadata) *http.Request {
	return r.WithContext(WithMetadata(r.Context(), metadata))
}

// WithMetadata returns a new context.Context which stores the given Metadata.
func WithMetadata(ctx context.Context, metadata *Metadata) context.Context {
	return context.WithValue(ctx, contextKeyOperationMetadata, metadata)
}

// MetadataFromContext returns the operation metadata associated with the
// given context. If there's no metadata, it returns nil.
func MetadataFromContext(ctx context.Context) *Metadata {
	metadata, _ := ctx.Value(contextKeyOperationMetadata).(*Metadata)
	return metadata
}
