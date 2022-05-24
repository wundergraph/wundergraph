//go:build prisma_cgo
// +build prisma_cgo

package database

import (
	"context"
	"io"

	"github.com/jensneuse/goprisma"
)

func NewHybridEngine(prismaSchema string) (HybridEngine, error) {
	engine, err := goprisma.NewEngine(prismaSchema)
	if err != nil {
		return nil, err
	}
	return &CGOEngine{
		engine: engine,
	}, nil
}

type CGOEngine struct {
	engine *goprisma.Engine
}

func (e *CGOEngine) Close() {
	e.engine.Close()
}

func (e *CGOEngine) Execute(_ context.Context, request []byte, w io.Writer) error {
	response, err := e.engine.Execute(string(request))
	if err != nil {
		return err
	}
	_, err = w.Write([]byte(response))
	return err
}
