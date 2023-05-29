//go:build !prisma_cgo
// +build !prisma_cgo

package database

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"go.uber.org/zap"

	"github.com/wundergraph/graphql-go-tools/pkg/ast"
)

func IntrospectPrismaDatabase(ctx context.Context, introspectionSchema, wundergraphDir string, loadPrismaSchemaFromDatabase bool, log *zap.Logger) (prismaSchema, graphqlSDL, dmmf string, err error) {
	engine := NewEngine(
		&http.Client{
			Timeout: time.Second * 30,
		},
		log,
		wundergraphDir,
	)
	defer engine.StopQueryEngine()
	if loadPrismaSchemaFromDatabase {
		prismaSchema, err = engine.IntrospectPrismaDatabaseSchema(ctx, introspectionSchema)
		if err != nil {
			return "", "", "", err
		}
	} else {
		prismaSchema = introspectionSchema
	}
	schemaFile, err := engine.StartQueryEngine(prismaSchema)
	if err != nil {
		if schemaFile != "" {
			os.Remove(schemaFile)
		}
		return "", "", "", err
	}
	defer os.Remove(schemaFile)
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

// ReverseOriginSchemaCompatibility reverses the changes made to the schema by the origin schema compatibility
// It's currently not used because normalization doesn't work with the raw sql changes
// TODO: Fix normalization and use this function
func ReverseOriginSchemaCompatibility(doc *ast.Document) error {
	mutationTypeName := doc.Index.MutationTypeName
	queryTypeName := doc.Index.QueryTypeName
	mutationNode, ok := doc.Index.FirstNodeByNameBytes(mutationTypeName)
	if !ok {
		return fmt.Errorf("mutation type not found")
	}
	queryNode, ok := doc.Index.FirstNodeByNameBytes(queryTypeName)
	if !ok {
		return fmt.Errorf("query type not found")
	}
	queryRawFieldDefinition, ok := doc.NodeFieldDefinitionByName(queryNode, []byte("queryRaw"))
	if !ok {
		return fmt.Errorf("queryRaw field not found")
	}
	queryRawJSONFieldDefinition, ok := doc.NodeFieldDefinitionByName(queryNode, []byte("queryRawJSON"))
	if !ok {
		return fmt.Errorf("queryRaw field not found")
	}
	// Remove queryRaw from query type
	doc.RemoveFieldDefinitionsFromObjectTypeDefinition([]int{queryRawFieldDefinition, queryRawJSONFieldDefinition}, queryNode.Ref)
	// Add queryRaw to mutation type
	doc.ObjectTypeDefinitions[mutationNode.Ref].FieldsDefinition.Refs = append(doc.ObjectTypeDefinitions[mutationNode.Ref].FieldsDefinition.Refs, queryRawFieldDefinition)

	parametersArg := doc.NodeFieldDefinitionArgumentDefinitionByName(mutationNode, []byte("queryRaw"), []byte("parameters"))
	if parametersArg == -1 {
		return fmt.Errorf("parameters argument not found")
	}

	jsonType := doc.AddNamedType([]byte("JSON"))
	doc.InputValueDefinitions[parametersArg].Type = jsonType
	doc.FieldDefinitions[queryRawFieldDefinition].Type = jsonType

	parametersArg = doc.NodeFieldDefinitionArgumentDefinitionByName(mutationNode, []byte("executeRaw"), []byte("parameters"))
	if parametersArg == -1 {
		return fmt.Errorf("parameters argument not found")
	}
	doc.InputValueDefinitions[parametersArg].Type = jsonType

	return nil
}
