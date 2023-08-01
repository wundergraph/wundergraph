package apihandler

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dgraph-io/ristretto"
	"github.com/gavv/httpexpect/v2"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"golang.org/x/sync/singleflight"

	"github.com/wundergraph/graphql-go-tools/pkg/astparser"
	"github.com/wundergraph/graphql-go-tools/pkg/asttransform"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"

	"github.com/wundergraph/wundergraph/pkg/pool"
)

const (
	graphqlTestSchema = `
	type Query {
		q1: String!
		q2: String!
	}`
)

func graphqlTestQueryWithOperationName(operationName string) string {
	return fmt.Sprintf(`
	{
		"query":"query a { q1 } query b { q2 }",
		"operationName":"%s"
	}`, operationName)
}

func TestGraphQLHandler_PlanCaching(t *testing.T) {
	// Test that plan caching doesn't incorrectly return a cached plan
	// for a different operationName
	definition, report := astparser.ParseGraphqlDocumentString(graphqlTestSchema)
	if report.HasErrors() {
		t.Fatal(report.Error())
	}

	err := asttransform.MergeDefinitionWithBaseSchema(&definition)
	assert.NoError(t, err)

	resolver := &FakeResolver{
		resolve: func(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte) []byte {
			// Return the queried field
			object := response.Data.(*resolve.Object)
			name := object.Fields[0].Name
			return []byte(fmt.Sprintf(`{"data":{"%s":"%s"}}`, name, name))
		},
	}

	planCache, err := ristretto.NewCache(&ristretto.Config{
		MaxCost:     1024 * 4,      // keep 4k execution plans in the cache
		NumCounters: 1024 * 4 * 10, // 4k * 10
		BufferItems: 64,            // number of keys per Get buffer.
	})
	assert.NoError(t, err)

	handler := &GraphQLHandler{
		definition: &definition,
		resolver:   resolver,
		planCache:  planCache,
		sf:         &singleflight.Group{},
		log:        zap.NewNop(),
		pool:       pool.New(),
	}

	srv := httptest.NewServer(handler)
	defer srv.Close()

	e := httpexpect.WithConfig(httpexpect.Config{
		BaseURL:  srv.URL,
		Reporter: httpexpect.NewAssertReporter(t),
	})

	e.POST("/graphql").
		WithBytes([]byte(graphqlTestQueryWithOperationName("a"))).WithHeader("Content-Type", "application/json").
		Expect().Status(http.StatusOK).Body().Equal(`{"data":{"q1":"q1"}}`)

	e.POST("/graphql").
		WithBytes([]byte(graphqlTestQueryWithOperationName("b"))).WithHeader("Content-Type", "application/json").
		Expect().Status(http.StatusOK).Body().Equal(`{"data":{"q2":"q2"}}`)

}
