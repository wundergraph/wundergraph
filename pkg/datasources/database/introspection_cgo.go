//go:build prisma_cgo
// +build prisma_cgo

package database

import (
	"github.com/jensneuse/goprisma"

	"github.com/wundergraph/graphql-go-tools/pkg/repair"
)

func IntrospectPrismaDatabase(introspectionSchema string) (prismaSchema, graphqlSDL string, err error) {
	prismaSchema, graphqlSDL, err = goprisma.Introspect(introspectionSchema)
	if err != nil {
		return
	}
	graphqlSDL = "schema { query: Query mutation: Mutation }\n" + graphqlSDL
	graphqlSDL, err = repair.SDL(graphqlSDL, repair.OptionsSDL{
		SetAllMutationFieldsNullable: true,
	})
	return
}
