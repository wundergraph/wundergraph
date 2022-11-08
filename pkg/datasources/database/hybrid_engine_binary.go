//go:build !prisma_cgo
// +build !prisma_cgo

package database

import (
	"context"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"
)

func NewHybridEngine(prismaSchema, wundergraphDir string, log *zap.Logger) (HybridEngine, error) {
	client := &http.Client{
		Timeout: time.Second * 5,
	}
	engine := NewEngine(client, log, wundergraphDir)
	err := engine.StartQueryEngine(prismaSchema)
	if err != nil {
		return nil, err
	}
	return &BinaryEngine{
		engine: engine,
	}, nil
}

type BinaryEngine struct {
	engine *Engine
}

func (e *BinaryEngine) WaitUntilReady(ctx context.Context) error {
	return e.engine.WaitUntilReady(ctx)
}

func (e *BinaryEngine) Close() {
	e.engine.StopQueryEngine()
}

func (e *BinaryEngine) Execute(ctx context.Context, request []byte, w io.Writer) error {
	return e.engine.Request(ctx, request, w)
}
