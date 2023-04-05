package database

import (
	"testing"

	"github.com/buger/jsonparser"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/datasourcetesting"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
)

const (
	schema = `

		type Query {
			queryRaw(query: String! parameters: [String]): String
			queryRawJSON(query: String! parameters: [String]): JSON
		}

		type Mutation {
			createOneusers(data: usersCreateInput): users
			executeRaw(query: String! parameters: [String]): Int!
		}

		type users {
				avatar: String
				id: Int!
				provider: String
				providerId: Int
	      someprovider: String
		}

		input usersCreateInput {
				avatar: String
				provider: String
				providerId: Int
				provider2: String
        someprovider: String
		}
	`

	operationWithSimilarAgrNames = `
		mutation CreateUser($provider: String!, $providerId: Int!, $someprovider: String!) {
			createOneusers(data: {provider: $provider, providerId: $providerId, provider2: $provider, someprovider: $someprovider}) {
				id
			}
		}
	`
)

func TestDatabaseDataSource(t *testing.T) {
	providerVariableRenderer, _ := resolve.NewGraphQLVariableRendererFromJSONRootTypeWithoutValidation(resolve.JsonRootType{Value: jsonparser.String})
	providerIdVariableRenderer, _ := resolve.NewGraphQLVariableRendererFromJSONRootTypeWithoutValidation(resolve.JsonRootType{Value: jsonparser.Number})
	spVariableRenderer, _ := resolve.NewGraphQLVariableRendererFromJSONRootTypeWithoutValidation(resolve.JsonRootType{Value: jsonparser.String})

	t.Run("createOneUser", datasourcetesting.RunTest(schema, operationWithSimilarAgrNames, "",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Nullable: false,
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"query":"mutation{createOneusers(data: {provider: $$0$$,providerId: $$1$$,provider2: $$0$$,someprovider: $$2$$}){id}}","variables":null}`,
						DataSource: &Source{},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"provider"},
								Renderer: providerVariableRenderer,
							},
							&resolve.ContextVariable{
								Path:     []string{"providerId"},
								Renderer: providerIdVariableRenderer,
							},
							&resolve.ContextVariable{
								Path:     []string{"someprovider"},
								Renderer: spVariableRenderer,
							},
						),
						DataSourceIdentifier: []byte("database.Source"),
						DisableDataLoader:    false,
						DisallowSingleFlight: true,
						ProcessResponseConfig: resolve.ProcessResponseConfig{
							ExtractGraphqlResponse:    true,
							ExtractFederationEntities: false,
						},
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("createOneusers"),
							Value: &resolve.Object{
								Nullable: true,
								Path:     []string{"createOneusers"},
								Fields: []*resolve.Field{
									{
										Name: []byte("id"),
										Value: &resolve.Integer{
											Path: []string{"id"},
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
							TypeName:   "Mutation",
							FieldNames: []string{"createOneusers"},
						},
					},
					ChildNodes: []plan.TypeField{
						{
							TypeName:   "users",
							FieldNames: []string{"id", "avatar", "provider", "providerId", "someprovider"},
						},
					},
					Custom: ConfigJson(Configuration{
						GraphqlSchema: schema,
					}),
					Factory: &Factory{testsSkipEngine: true},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:  "Mutation",
					FieldName: "createOneusers",
					Arguments: []plan.ArgumentConfiguration{
						{
							Name:       "data",
							SourceType: plan.FieldArgumentSource,
						},
					},
				},
			},
			DisableResolveFieldPositions: true,
		},
	))
}
