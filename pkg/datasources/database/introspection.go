//go:build !prisma_cgo
// +build !prisma_cgo

package database

import (
	"context"
	"net/http"
	"time"

	"go.uber.org/zap"
)

func IntrospectPrismaDatabase(ctx context.Context, introspectionSchema, wundergraphDir string, log *zap.Logger) (prismaSchema, graphqlSDL, dmmf string, err error) {
	engine := NewEngine(
		&http.Client{
			Timeout: time.Second * 30,
		},
		log,
		wundergraphDir,
	)
	defer engine.StopQueryEngine()
	prismaSchema, err = engine.IntrospectPrismaDatabaseSchema(ctx, introspectionSchema)
	if err != nil {
		return "", "", "", err
	}
	err = engine.StartQueryEngine(prismaSchema)
	if err != nil {
		return "", "", "", err
	}
	graphqlSDL, err = engine.IntrospectGraphQLSchema(ctx)
	if err != nil {
		return "", "", "", err
	}
	dmmf, err = engine.IntrospectDMMF(ctx)
	if err != nil {
		return "", "", "", err
	}
	return
}
