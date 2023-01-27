package database

import (
	"reflect"
	"testing"
	"unsafe"

	"github.com/buger/jsonparser"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/datasourcetesting"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
)

const (
	schema = `
		type Mutation {
			createOneusers(data: usersCreateInput): users
		}

		type users {
				avatar: String
				id: Int!
				provider: String
				providerId: Int
		}

		input usersCreateInput {
				avatar: String
				provider: String
				providerId: Int
				provider2: String
		}
	`

	operationWithSimilarAgrNames = `
		mutation CreateUser($provider: String!, $providerId: Int!) {
			createOneusers(data: {provider: $provider, providerId: $providerId, provider2: $provider}) {
				id
			}
		}
	`
)

func changeJsonRootType(f *resolve.GraphQLVariableRenderer, v resolve.JsonRootType) {
	pointerVal := reflect.ValueOf(f)
	val := reflect.Indirect(pointerVal)
	member := val.FieldByName("rootValueType")
	ptrToY := unsafe.Pointer(member.UnsafeAddr())
	realPtrToY := (*resolve.JsonRootType)(ptrToY)
	*realPtrToY = v
}

func TestDatabaseDataSource(t *testing.T) {
	providerVariableRenderer := &resolve.GraphQLVariableRenderer{Kind: resolve.VariableRendererKindGraphqlWithValidation}
	changeJsonRootType(providerVariableRenderer, resolve.JsonRootType{Value: jsonparser.String})
	providerIdVariableRenderer := &resolve.GraphQLVariableRenderer{Kind: resolve.VariableRendererKindGraphqlWithValidation}
	changeJsonRootType(providerIdVariableRenderer, resolve.JsonRootType{Value: jsonparser.Number})

	t.Run("createOneUser", datasourcetesting.RunTest(schema, operationWithSimilarAgrNames, "",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Nullable: false,
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"query":"mutation{createOneusers(data: {provider: $$0$$,providerId: $$1$$,provider2: $$0$$}){id}}","variables":null}`,
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
							FieldNames: []string{"id", "avatar", "provider", "providerId"},
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
