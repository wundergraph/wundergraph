package oas_datasource

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/buger/jsonparser"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/wundergraph/graphql-go-tools/pkg/ast"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/datasourcetesting"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
)

const (
	schema = `
		type Query {
			friend: Friend
			withArgument(id: String!, name: String, optional: String): Friend
			withArrayArguments(names: [String]): Friend
		}

		type Subscription {
			friend: Friend
			withArgument(id: String!, name: String, optional: String): Friend
			withArrayArguments(names: [String]): Friend
		}

		type Friend {
			name: String
			pet: Pet
			phone(name: String!): String
		}

		type Pet {
			id: String
			name: String
		}
	`

	simpleOperation = `
		query {
			friend {
				name
			}
		}
	`
	nestedOperation = `
		query {
			friend {
				name
				pet {
					id
					name
				}
			}
		}
	`

	argumentOperation = `
		query ArgumentQuery($idVariable: String!) {
			withArgument(id: $idVariable, name: "foo") {
				name
			}
		}
	`

	duplicatedArgumentOperationWithAlias = `
		query ArgumentQuery($idVariable: String!) {
			withArgument(id: $idVariable, name: "foo") {
				name
				homePhone: phone(name: "home")
				officePhone: phone(name: "office")
			}

			aliased: withArgument(id: $idVariable, name: "bar") {
				name
			}
		}
	`

	argumentWithoutVariablesOperation = `
		query ArgumentWithoutVariablesQuery {
			withArgument(id: "123abc", name: "foo") {
				name
			}
		}
	`

	// nolint
	argumentSubscription = `
		subscription ArgumentQuery($idVariable: String!) {
			withArgument(id: $idVariable, name: "foo") {
				name
			}
		}
	`

	arrayArgumentOperation = `
		query ArgumentQuery {
			withArrayArguments(names: ["foo","bar"]) {
				name
			}
		}
	`
)

func TestOpenApiDataSource(t *testing.T) {
	t.Run("get request", datasourcetesting.RunTest(schema, nestedOperation, "",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:             0,
						Input:                `{"url":"https://example.com/friend","method":"GET"}`,
						DataSource:           &Source{},
						DataSourceIdentifier: []byte("oas_datasource.Source"),
						DisableDataLoader:    true,
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("friend"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fetch: &resolve.SingleFetch{
									BufferId:   1,
									Input:      `{"url":"https://example.com/friend/$$0$$/pet","method":"GET"}`,
									DataSource: &Source{},
									Variables: resolve.NewVariables(
										&resolve.ObjectVariable{
											Path:     []string{"name"},
											Renderer: resolve.NewPlainVariableRenderer(),
										},
									),
									DataSourceIdentifier: []byte("oas_datasource.Source"),
									DisableDataLoader:    true,
								},
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 5,
										},
									},
									{
										HasBuffer: true,
										BufferID:  1,
										Name:      []byte("pet"),
										Position: resolve.Position{
											Line:   5,
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
														Line:   6,
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
														Line:   7,
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
				},
			},
		},
		plan.Configuration{
			DataSources: []plan.DataSourceConfiguration{
				{
					RootNodes: []plan.TypeField{
						{
							TypeName:   "Query",
							FieldNames: []string{"friend"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/friend",
							Method: "GET",
						},
					}),
					Factory: &Factory{},
				},
				{
					RootNodes: []plan.TypeField{
						{
							TypeName:   "Friend",
							FieldNames: []string{"pet"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/friend/{{ .object.name }}/pet",
							Method: "GET",
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "friend",
					DisableDefaultMapping: true,
				},
				{
					TypeName:              "Friend",
					FieldName:             "pet",
					DisableDefaultMapping: true,
				},
			},
		},
	))
	t.Run("get request with argument", datasourcetesting.RunTest(schema, argumentOperation, "ArgumentQuery",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"url":"https://example.com/$$0$$/$$1$$","method":"GET"}`,
						DataSource: &Source{},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"idVariable"},
								Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string"]}`),
							},
							&resolve.ContextVariable{
								Path:     []string{"a"},
								Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string","null"]}`),
							},
						),
						DataSourceIdentifier: []byte("oas_datasource.Source"),
						DisableDataLoader:    true,
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("withArgument"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 5,
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
							FieldNames: []string{"withArgument"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/{{ .arguments.id }}/{{ .arguments.name }}",
							Method: "GET",
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "withArgument",
					DisableDefaultMapping: true,
				},
			},
		},
	))
	t.Run("post request with nested JSON body", datasourcetesting.RunTest(authSchema, `
		mutation Login ($phoneNumber: String! $a: String) {
			Login: postPasswordlessStart(
				postPasswordlessStartInput: {
					applicationId: $a
					loginId: $phoneNumber
				}
			) {
				code
			}
		}
`, "Login",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"url":"https://example.com/passwordless_start","method":"POST","body":{"applicationId":$$0$$,"loginId":$$1$$}}`,
						DataSource: &Source{},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"a"},
								Renderer: resolve.NewJSONVariableRendererWithValidation(`{"type":["string","null"]}`),
							},
							&resolve.ContextVariable{
								Path:     []string{"phoneNumber"},
								Renderer: resolve.NewJSONVariableRendererWithValidation(`{"type":["string","null"]}`),
							},
						),
						DataSourceIdentifier: []byte("oas_datasource.Source"),
						DisallowSingleFlight: true,
						DisableDataLoader:    true,
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("Login"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("code"),
										Value: &resolve.String{
											Path:     []string{"code"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   9,
											Column: 5,
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
							FieldNames: []string{"postPasswordlessStart"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/passwordless_start",
							Method: "POST",
							Body:   "{{ .arguments.postPasswordlessStartInput }}",
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Mutation",
					FieldName:             "postPasswordlessStart",
					DisableDefaultMapping: true,
				},
			},
		},
	))
	t.Run("get request with duplicated argument and alias", datasourcetesting.RunTest(schema, duplicatedArgumentOperationWithAlias, "ArgumentQuery",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.ParallelFetch{
						Fetches: []resolve.Fetch{
							&resolve.SingleFetch{
								BufferId:   0,
								Input:      `{"url":"https://example.com/$$0$$/$$1$$","method":"GET"}`,
								DataSource: &Source{},
								Variables: resolve.NewVariables(
									&resolve.ContextVariable{
										Path:     []string{"idVariable"},
										Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string"]}`),
									},
									&resolve.ContextVariable{
										Path:     []string{"a"},
										Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string","null"]}`),
									},
								),
								DataSourceIdentifier: []byte("oas_datasource.Source"),
								DisableDataLoader:    true,
							},
							&resolve.SingleFetch{
								BufferId:   3,
								Input:      `{"url":"https://example.com/$$0$$/$$1$$","method":"GET"}`,
								DataSource: &Source{},
								Variables: resolve.NewVariables(
									&resolve.ContextVariable{
										Path:     []string{"idVariable"},
										Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string"]}`),
									},
									&resolve.ContextVariable{
										Path:     []string{"d"},
										Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string","null"]}`),
									},
								),
								DataSourceIdentifier: []byte("oas_datasource.Source"),
								DisableDataLoader:    true,
							},
						},
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("withArgument"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fetch: &resolve.ParallelFetch{
									Fetches: []resolve.Fetch{
										&resolve.SingleFetch{
											BufferId:   1,
											Input:      `{"url":"https://example.com/friends/phone/$$0$$","method":"GET"}`,
											DataSource: &Source{},
											Variables: resolve.NewVariables(
												&resolve.ContextVariable{
													Path:     []string{"b"},
													Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string"]}`),
												},
											),
											DataSourceIdentifier: []byte("oas_datasource.Source"),
											DisableDataLoader:    true,
										},
										&resolve.SingleFetch{
											BufferId:   2,
											Input:      `{"url":"https://example.com/friends/phone/$$0$$","method":"GET"}`,
											DataSource: &Source{},
											Variables: resolve.NewVariables(
												&resolve.ContextVariable{
													Path:     []string{"c"},
													Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string"]}`),
												},
											),
											DataSourceIdentifier: []byte("oas_datasource.Source"),
											DisableDataLoader:    true,
										},
									},
								},
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 5,
										},
									},
									{
										BufferID:  1,
										HasBuffer: true,
										Name:      []byte("homePhone"),
										Value: &resolve.String{
											Path:     []string{"phone"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   5,
											Column: 5,
										},
									},
									{
										BufferID:  2,
										HasBuffer: true,
										Name:      []byte("officePhone"),
										Value: &resolve.String{
											Path:     []string{"phone"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   6,
											Column: 5,
										},
									},
								},
							},
						},
						{
							BufferID:  3,
							HasBuffer: true,
							Name:      []byte("aliased"),
							Position: resolve.Position{
								Line:   9,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   10,
											Column: 5,
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
							FieldNames: []string{"withArgument"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/{{ .arguments.id }}/{{ .arguments.name }}",
							Method: "GET",
						},
					}),
					Factory: &Factory{},
				},
				{
					RootNodes: []plan.TypeField{
						{
							TypeName:   "Friend",
							FieldNames: []string{"phone"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/friends/phone/{{ .arguments.name }}",
							Method: "GET",
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "withArgument",
					DisableDefaultMapping: true,
				},
			},
		},
		func(t *testing.T, op ast.Document, actualPlan plan.Plan) {
			assert.Equal(t, `{"a":"foo","b":"home","c":"office","d":"bar"}`, string(op.Input.Variables))
		},
	))
	t.Run("get request with argument using templates with and without spaces", datasourcetesting.RunTest(schema, argumentWithoutVariablesOperation, "ArgumentWithoutVariablesQuery",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"url":"https://example.com/$$0$$/$$1$$","method":"GET"}`,
						DataSource: &Source{},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"a"},
								Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string"]}`),
							},
							&resolve.ContextVariable{
								Path:     []string{"b"},
								Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string","null"]}`),
							},
						),
						DataSourceIdentifier: []byte("oas_datasource.Source"),
						DisableDataLoader:    true,
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("withArgument"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 5,
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
							FieldNames: []string{"withArgument"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/{{.arguments.id}}/{{   .arguments.name   }}",
							Method: "GET",
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "withArgument",
					DisableDefaultMapping: true,
				},
			},
		},
	))
	t.Run("post request with body", datasourcetesting.RunTest(schema, simpleOperation, "",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:             0,
						Input:                `{"url":"https://example.com/friend","method":"POST","body":{"foo":"bar"}}`,
						DataSource:           &Source{},
						DisallowSingleFlight: true,
						DataSourceIdentifier: []byte("oas_datasource.Source"),
						DisableDataLoader:    true,
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("friend"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 5,
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
							FieldNames: []string{"friend"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/friend",
							Method: "POST",
							Body:   "{\"foo\":\"bar\"}",
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "friend",
					DisableDefaultMapping: true,
				},
			},
		},
	))
	t.Run("get request with headers", datasourcetesting.RunTest(schema, simpleOperation, "",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"url":"https://example.com/friend","method":"GET","header":{"Authorization":["Bearer 123"],"Invalid-Template":["{{ request.headers.Authorization }}"],"Token":["Bearer $$0$$"],"X-API-Key":["456"]}}`,
						DataSource: &Source{},
						Variables: []resolve.Variable{
							&resolve.HeaderVariable{
								Path: []string{"Authorization"},
							},
						},
						DataSourceIdentifier: []byte("oas_datasource.Source"),
						DisableDataLoader:    true,
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("friend"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 5,
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
							FieldNames: []string{"friend"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/friend",
							Method: "GET",
							Header: http.Header{
								"Authorization":    []string{"Bearer 123"},
								"X-API-Key":        []string{"456"},
								"Token":            []string{"Bearer {{ .request.headers.Authorization }}"},
								"Invalid-Template": []string{"{{ request.headers.Authorization }}"},
							},
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "friend",
					DisableDefaultMapping: true,
				},
			},
		},
	))
	t.Run("get request with query", datasourcetesting.RunTest(schema, argumentOperation, "ArgumentQuery",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"url":"https://example.com/friend","method":"GET","query_params":[{"name":"static","value":"staticValue"},{"name":"static","value":"secondStaticValue"},{"name":"name","value":"$$0$$"},{"name":"id","value":"$$1$$"}]}`,
						DataSource: &Source{},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"a"},
								Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string","null"]}`),
							},
							&resolve.ContextVariable{
								Path:     []string{"idVariable"},
								Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["string"]}`),
							},
						),
						DataSourceIdentifier: []byte("oas_datasource.Source"),
						DisableDataLoader:    true,
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("withArgument"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 5,
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
							FieldNames: []string{"withArgument"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/friend",
							Method: "GET",
							Query: []QueryConfiguration{
								{
									Name:  "static",
									Value: "staticValue",
								},
								{
									Name:  "static",
									Value: "secondStaticValue",
								},
								{
									Name:  "name",
									Value: "{{ .arguments.name }}",
								},
								{
									Name:  "id",
									Value: "{{ .arguments.id }}",
								},
								{
									Name:  "optional",
									Value: "{{ .arguments.optional }}",
								},
							},
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "withArgument",
					DisableDefaultMapping: true,
				},
			},
		},
	))
	t.Run("get request with array query", datasourcetesting.RunTest(schema, arrayArgumentOperation, "ArgumentQuery",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"url":"https://example.com/friend","method":"GET","query_params":[{"name":"names","value":"$$0$$"}]}`,
						DataSource: &Source{},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"a"},
								Renderer: resolve.NewPlainVariableRendererWithValidation(`{"type":["array","null"],"items":{"type":["string","null"]}}`),
							},
						),
						DataSourceIdentifier: []byte("oas_datasource.Source"),
						DisableDataLoader:    true,
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("withArrayArguments"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 5,
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
							FieldNames: []string{"withArrayArguments"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/friend",
							Method: "GET",
							Query: []QueryConfiguration{
								{
									Name:  "names",
									Value: "{{ .arguments.names }}",
								},
							},
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "withArrayArguments",
					DisableDefaultMapping: true,
				},
			},
		},
	))
	t.Run("get request with array query", datasourcetesting.RunTest(schema, arrayArgumentOperation, "ArgumentQuery",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Fetch: &resolve.SingleFetch{
						BufferId:   0,
						Input:      `{"url":"https://example.com/friend/$$0$$","method":"GET"}`,
						DataSource: &Source{},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path: []string{"a"},
								Renderer: resolve.NewCSVVariableRenderer(resolve.JsonRootType{
									Kind:  resolve.JsonRootTypeKindSingle,
									Value: jsonparser.String,
								}),
							},
						),
						DataSourceIdentifier: []byte("oas_datasource.Source"),
						DisableDataLoader:    true,
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("withArrayArguments"),
							Position: resolve.Position{
								Line:   3,
								Column: 4,
							},
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("name"),
										Value: &resolve.String{
											Path:     []string{"name"},
											Nullable: true,
										},
										Position: resolve.Position{
											Line:   4,
											Column: 5,
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
							FieldNames: []string{"withArrayArguments"},
						},
					},
					Custom: ConfigJSON(Configuration{
						Fetch: FetchConfiguration{
							URL:    "https://example.com/friend/{{ .arguments.names }}",
							Method: "GET",
						},
					}),
					Factory: &Factory{},
				},
			},
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "withArrayArguments",
					DisableDefaultMapping: true,
					Arguments: []plan.ArgumentConfiguration{
						{
							Name:         "names",
							RenderConfig: plan.RenderArgumentAsArrayCSV,
						},
					},
				},
			},
		},
	))
}

func TestHttpJsonDataSource_Load(t *testing.T) {

	runTests := func(t *testing.T, source *Source) {
		t.Run("simple get", func(t *testing.T) {

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, r.Method, http.MethodGet)
				_, _ = w.Write([]byte(`ok`))
			}))

			defer server.Close()

			input := []byte(fmt.Sprintf(`{"method":"GET","url":"%s"}`, server.URL))
			b := &strings.Builder{}
			require.NoError(t, source.Load(context.Background(), input, b))
			assert.Equal(t, `ok`, b.String())
		})
		t.Run("get with query parameters", func(t *testing.T) {

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, r.Method, http.MethodGet)
				fooQueryParam := r.URL.Query().Get("foo")
				assert.Equal(t, fooQueryParam, "bar")
				doubleQueryParam := r.URL.Query()["double"]
				assert.Len(t, doubleQueryParam, 2)
				assert.Equal(t, "first", doubleQueryParam[0])
				assert.Equal(t, "second", doubleQueryParam[1])
				_, _ = w.Write([]byte(`ok`))
			}))

			defer server.Close()

			input := []byte(fmt.Sprintf(`{"query_params":[{"name":"foo","value":"bar"},{"name":"double","value":"first"},{"name":"double","value":"second"}],"method":"GET","url":"%s"}`, server.URL))
			b := &strings.Builder{}
			require.NoError(t, source.Load(context.Background(), input, b))
			assert.Equal(t, `ok`, b.String())
		})
		t.Run("get with headers", func(t *testing.T) {

			authorization := "Bearer 123"
			xApiKey := "456"

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, r.Method, http.MethodGet)
				assert.Equal(t, authorization, r.Header.Get("Authorization"))
				assert.Equal(t, xApiKey, r.Header.Get("X-API-KEY"))
				assert.Equal(t, []string{"one", "two"}, r.Header["Multi"])
				assert.Equal(t, "x,y", r.Header.Get("MultiComma"))

				_, _ = w.Write([]byte(`ok`))
			}))

			defer server.Close()

			input := []byte(fmt.Sprintf(`{"method":"GET","url":"%s","header":{"Multi":["one", "two"],"MultiComma":["x,y"],"Authorization":["Bearer 123"],"Token":["%s"],"X-API-Key":["%s"]}}`, server.URL, authorization, xApiKey))
			b := &strings.Builder{}
			require.NoError(t, source.Load(context.Background(), input, b))
			assert.Equal(t, `ok`, b.String())
		})
		t.Run("post with body", func(t *testing.T) {

			body := `{"foo":"bar"}`

			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, http.MethodPost, r.Method)
				actualBody, err := ioutil.ReadAll(r.Body)
				assert.NoError(t, err)
				assert.Equal(t, string(actualBody), body)
				_, _ = w.Write([]byte(`ok`))
			}))

			defer server.Close()

			input := []byte(fmt.Sprintf(`{"method":"POST","url":"%s","body":%s}`, server.URL, body))
			b := &strings.Builder{}
			require.NoError(t, source.Load(context.Background(), input, b))
			assert.Equal(t, `ok`, b.String())
		})
	}

	t.Run("net/http", func(t *testing.T) {
		source := &Source{
			client: http.DefaultClient,
		}
		runTests(t, source)
	})
}

const authSchema = `
type Mutation {
  postPasswordlessStart(postPasswordlessStartInput: postPasswordlessStartInput): PostPasswordlessStart
  postPasswordlessStartList(postPasswordlessStartInput: [postPasswordlessStartInput]): PostPasswordlessStart
  postPasswordlessLogin(postPasswordlessLoginInput: postPasswordlessLoginInput): PostPasswordlessLogin
}

type PostPasswordlessStart {
  code: String
}

input postPasswordlessStartInput {
  applicationId: String
  loginId: String
  nested: postPasswordlessStartInput
}

type PostPasswordlessLogin {
  refreshToken: String
  token: String
  user: User
}

type User {
  username: String
  verified: Boolean
  firstName: String
  lastName: String
  email: String
  mobilePhone: String
  timezone: String
}

input postPasswordlessLoginInput {
  code: String
  ipAddress: String
  metaData: MetaDataInput
}

input MetaDataInput {
  device: DeviceInput
}

input DeviceInput {
  name: String
}
`
