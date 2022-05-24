package database

import (
	"context"
	"encoding/json"
	"io"
)

type HybridEngine interface {
	Close()
	Execute(ctx context.Context, request []byte, w io.Writer) error
}

type GQLRequest struct {
	Query     string          `json:"query"`
	Variables json.RawMessage `json:"variables"`
}
