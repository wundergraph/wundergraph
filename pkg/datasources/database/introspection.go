//go:build !prisma_cgo
// +build !prisma_cgo

package database

import (
	"context"
	"net/http"
	"time"

	"go.uber.org/zap"
)

func IntrospectPrismaDatabase(introspectionSchema, wundergraphDir string, log *zap.Logger) (prismaSchema, graphqlSDL, dmmf string, err error) {
	engine := NewEngine(
		&http.Client{
			Timeout: time.Second * 10,
		},
		log,
		wundergraphDir,
	)
	defer engine.StopQueryEngine()
	prismaSchema, err = engine.IntrospectPrismaDatabaseSchema(introspectionSchema)
	if err != nil {
		return "", "", "", err
	}
	err = engine.StartQueryEngine(prismaSchema)
	if err != nil {
		return "", "", "", err
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
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
