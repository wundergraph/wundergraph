package grpc

import (
	"net/http"
	"testing"

	. "github.com/wundergraph/graphql-go-tools/pkg/engine/datasourcetesting"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"

	"github.com/wundergraph/wundergraph/pkg/datasources/grpc/testdata/starwars"
)

func TestGrpcDataSourcePlanning(t *testing.T) {
	t.Run("inline object value with arguments", RunTest(
		starwars.GrpcGeneratedSchema, `
			query GetHero($episode: starwars_Episode) {
				starwars_StarwarsService_GetHero(input: {episode: $episode}){
					id
					name
			  	}
			}`,
		"GetHero",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"body":{"episode":$$0$$},"header":{"auth":["abc"]}}`,
						DataSource: &Source{},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"episode"},
								Renderer: resolve.NewJSONVariableRendererWithValidation(`{"type":["string","null"]}`),
							},
						),
						DisableDataLoader:    true,
						DataSourceIdentifier: []byte("grpc.Source"),
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("starwars_StarwarsService_GetHero"),
							Position: resolve.Position{
								Line:   3,
								Column: 5,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("id"),
										Value: &resolve.String{
											Path:     []string{"id"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 6,
										},
									},
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   5,
											Column: 6,
										},
									},
								},
							},
						},
					},
				},
			},
		},
		plan.Configuration{
			DataSources: []plan.DataSourceConfiguration{
				{
					RootNodes: []plan.TypeField{
						{
							TypeName:   "Query",
							FieldNames: []string{"starwars_StarwarsService_GetHero"},
						},
					},
					Custom: ConfigJson(Configuration{
						Request: RequestConfiguration{
							Header: http.Header{"auth": []string{"abc"}},
							Body:   "{{ .arguments.input }}",
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "starwars_StarwarsService_GetHero",
					DisableDefaultMapping: true,
				},
			},
		},
	))

}
