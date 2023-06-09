package nats

import (
	"bytes"
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/hashicorp/go-uuid"
	natsServer "github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats.go"
	"github.com/stretchr/testify/assert"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/datasourcetesting"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
	"github.com/wundergraph/wundergraph/pkg/wgpb"

	natsTest "github.com/nats-io/nats-server/v2/test"
)

const (
	schema = `

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}

type Query {
  "Get returns the latest value for the key."
  token_get(key: String!): token_KeyValueEntry
  "GetRevision returns a specific revision value for the key."
  token_getRevision(key: String!, revision: Int!): token_KeyValueEntry
  "Keys will return all keys."
  token_keys: [String!]!
  "History will return all historical values for the key."
  token_history(key: String!): [token_KeyValueEntry!]!
}

type Mutation {
  "Put will place the new value for the key into the store."
  token_put(key: String!, value: token_InputValue!): token_KeyValueEntry
  "Create will add the key/value pair iff it does not exist."
  token_create(key: String!, value: token_InputValue!): token_KeyValueEntry
  "Update will update the value iff the latest revision matches."
  token_update(key: String!, value: token_InputValue!, revision: Int!): token_KeyValueEntry
  "Delete will place a delete marker and leave all revisions."
  token_delete(key: String!): Boolean!
  "Purge will place a delete marker and remove all previous revisions."
  token_purge(key: String!): Boolean!
}

type Subscription {
  """
   Watch for any updates to keys that match the keys argument which could include wildcards.
  Watch will send a nil entry when it has received all initial values.
  """
  token_watch(keys: [String!]!): [token_KeyValueEntry!]!
  "WatchAll will invoke the callback for all updates."
  token_watchAll: [token_KeyValueEntry!]!
}

type token_KeyValueEntry {
  key: String!
  value: token_Value!
  revision: Int!
  created: Date!
}

input token_InputValueUser {
  id: Float!
}

input token_InputValueOrg {
  id: Float!
}

input token_InputValue {
  token: String!
  user: token_InputValueUser!
  org: token_InputValueOrg!
}

type token_ValueUser {
  id: Float!
}

type token_ValueOrg {
  id: Float!
}

type token_Value {
  token: String!
  user: token_ValueUser!
  org: token_ValueOrg!
}`
)

func TestNatsDataSource(t *testing.T) {
	server := natsTest.RunServer(&natsServer.Options{
		JetStream: true,
	})
	defer server.Shutdown()

	keyVariableRenderer := resolve.NewJSONVariableRendererWithValidation(`{"type":["string"]}`)
	inputVariableRenderer := resolve.NewJSONVariableRendererWithValidation(`{"type":["object"],"properties":{"org":{"$ref":"#/$defs/token_InputValueOrg"},"token":{"type":["string"]},"user":{"$ref":"#/$defs/token_InputValueUser"}},"required":["token","user","org"],"additionalProperties":false,"$defs":{"token_InputValueOrg":{"type":["object"],"properties":{"id":{"type":["number"]}},"required":["id"],"additionalProperties":false},"token_InputValueUser":{"type":["object"],"properties":{"id":{"type":["number"]}},"required":["id"],"additionalProperties":false}}}`)

	t.Run("token_put", datasourcetesting.RunTest(schema, `mutation($key: String! $input: token_InputValue!){token_put(key: $key, value: $input){value{token}}}`, "",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Nullable: false,
					Fetch: &resolve.SingleFetch{
						BufferId: 0,
						Input:    `{"args":{"key":"key","value":"input"},"variables":{"key":$$0$$,"input":$$1$$}}`,
						DataSource: &KeyValueSource{
							Operation: wgpb.NatsKvOperation_NATSKV_PUT,
						},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"key"},
								Renderer: keyVariableRenderer,
							},
							&resolve.ContextVariable{
								Path:     []string{"input"},
								Renderer: inputVariableRenderer,
							},
						),
						DataSourceIdentifier: []byte("nats.KeyValueSource"),
						DisableDataLoader:    true,
						DisallowSingleFlight: true,
						ProcessResponseConfig: resolve.ProcessResponseConfig{
							ExtractGraphqlResponse:    false,
							ExtractFederationEntities: false,
						},
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("token_put"),
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("value"),
										Value: &resolve.Object{
											Nullable: false,
											Path:     []string{"value"},
											Fields: []*resolve.Field{
												{
													Name: []byte("token"),
													Value: &resolve.String{
														Path: []string{"token"},
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
							TypeName:   "Mutation",
							FieldNames: []string{"token_put"},
						},
					},
					Custom: ConfigJson(Configuration{
						Operation: wgpb.NatsKvOperation_NATSKV_PUT,
						Bucket:    "token",
						ServerURL: nats.DefaultURL,
					}),
					Factory: &Factory{},
				},
			},
			DisableResolveFieldPositions: true,
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Mutation",
					FieldName:             "token_put",
					DisableDefaultMapping: true,
				},
			},
		},
	))

	t.Run("token_create", datasourcetesting.RunTest(schema, `mutation($key: String! $input: token_InputValue!){token_create(key: $key, value: $input){value{token}}}`, "",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Nullable: false,
					Fetch: &resolve.SingleFetch{
						BufferId: 0,
						Input:    `{"args":{"key":"key","value":"input"},"variables":{"key":$$0$$,"input":$$1$$}}`,
						DataSource: &KeyValueSource{
							Operation: wgpb.NatsKvOperation_NATSKV_CREATE,
						},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"key"},
								Renderer: keyVariableRenderer,
							},
							&resolve.ContextVariable{
								Path:     []string{"input"},
								Renderer: inputVariableRenderer,
							},
						),
						DataSourceIdentifier: []byte("nats.KeyValueSource"),
						DisableDataLoader:    true,
						DisallowSingleFlight: true,
						ProcessResponseConfig: resolve.ProcessResponseConfig{
							ExtractGraphqlResponse:    false,
							ExtractFederationEntities: false,
						},
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("token_create"),
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("value"),
										Value: &resolve.Object{
											Nullable: false,
											Path:     []string{"value"},
											Fields: []*resolve.Field{
												{
													Name: []byte("token"),
													Value: &resolve.String{
														Path: []string{"token"},
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
							TypeName:   "Mutation",
							FieldNames: []string{"token_create"},
						},
					},
					Custom: ConfigJson(Configuration{
						Operation: wgpb.NatsKvOperation_NATSKV_CREATE,
						Bucket:    "token",
						ServerURL: nats.DefaultURL,
					}),
					Factory: &Factory{},
				},
			},
			DisableResolveFieldPositions: true,
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Mutation",
					FieldName:             "token_create",
					DisableDefaultMapping: true,
				},
			},
		},
	))

	t.Run("token_delete", datasourcetesting.RunTest(schema, `mutation($key: String!){token_delete(key: $key)}`, "",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Nullable: false,
					Fetch: &resolve.SingleFetch{
						BufferId: 0,
						Input:    `{"args":{"key":"key"},"variables":{"key":$$0$$}}`,
						DataSource: &KeyValueSource{
							Operation: wgpb.NatsKvOperation_NATSKV_DELETE,
						},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"key"},
								Renderer: keyVariableRenderer,
							},
						),
						DataSourceIdentifier: []byte("nats.KeyValueSource"),
						DisableDataLoader:    true,
						DisallowSingleFlight: true,
						ProcessResponseConfig: resolve.ProcessResponseConfig{
							ExtractGraphqlResponse:    false,
							ExtractFederationEntities: false,
						},
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("token_delete"),
							Value: &resolve.Boolean{
								Nullable: false,
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
							FieldNames: []string{"token_delete"},
						},
					},
					Custom: ConfigJson(Configuration{
						Operation: wgpb.NatsKvOperation_NATSKV_DELETE,
						Bucket:    "token",
						ServerURL: nats.DefaultURL,
					}),
					Factory: &Factory{},
				},
			},
			DisableResolveFieldPositions: true,
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Mutation",
					FieldName:             "token_delete",
					DisableDefaultMapping: true,
				},
			},
		},
	))

	t.Run("token_get", datasourcetesting.RunTest(schema, `query($key: String!){token_get(key: $key){value{token}}}`, "",
		&plan.SynchronousResponsePlan{
			Response: &resolve.GraphQLResponse{
				Data: &resolve.Object{
					Nullable: false,
					Fetch: &resolve.SingleFetch{
						BufferId: 0,
						Input:    `{"args":{"key":"key"},"variables":{"key":$$0$$}}`,
						DataSource: &KeyValueSource{
							Operation: wgpb.NatsKvOperation_NATSKV_GET,
						},
						Variables: resolve.NewVariables(
							&resolve.ContextVariable{
								Path:     []string{"key"},
								Renderer: keyVariableRenderer,
							},
						),
						DataSourceIdentifier: []byte("nats.KeyValueSource"),
						DisableDataLoader:    true,
						DisallowSingleFlight: true,
						ProcessResponseConfig: resolve.ProcessResponseConfig{
							ExtractGraphqlResponse:    false,
							ExtractFederationEntities: false,
						},
					},
					Fields: []*resolve.Field{
						{
							BufferID:  0,
							HasBuffer: true,
							Name:      []byte("token_get"),
							Value: &resolve.Object{
								Nullable: true,
								Fields: []*resolve.Field{
									{
										Name: []byte("value"),
										Value: &resolve.Object{
											Nullable: false,
											Path:     []string{"value"},
											Fields: []*resolve.Field{
												{
													Name: []byte("token"),
													Value: &resolve.String{
														Path: []string{"token"},
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
							FieldNames: []string{"token_get"},
						},
					},
					Custom: ConfigJson(Configuration{
						Operation: wgpb.NatsKvOperation_NATSKV_GET,
						Bucket:    "token",
						ServerURL: nats.DefaultURL,
					}),
					Factory: &Factory{},
				},
			},
			DisableResolveFieldPositions: true,
			Fields: []plan.FieldConfiguration{
				{
					TypeName:              "Query",
					FieldName:             "token_get",
					DisableDefaultMapping: true,
				},
			},
		},
	))
}

func TestNatsKeyValueDataSourceLoad(t *testing.T) {
	randomId, err := uuid.GenerateUUID()
	assert.NoError(t, err)
	storageDir := filepath.Join(os.TempDir(), "nats", "test", randomId)
	assert.NoError(t, err)
	server := natsTest.RunServer(&natsServer.Options{
		JetStream: true,
		StoreDir:  storageDir,
	})
	defer func() {
		server.Shutdown()
		err := os.RemoveAll(storageDir)
		if err != nil {
			t.Errorf("error removing storage dir: %s", err)
		}
	}()

	nc, err := nats.Connect(nats.DefaultURL)
	assert.NoError(t, err)
	js, err := nc.JetStream(nats.PublishAsyncMaxPending(256))
	assert.NoError(t, err)

	kv, err := js.CreateKeyValue(&nats.KeyValueConfig{
		Bucket: "token",
	})
	assert.NoError(t, err)

	t.Run("token_put_get_delete", func(t *testing.T) {
		ds := &KeyValueSource{
			kv: kv,
			overrideCreatedTime: func() *int64 {
				zero := int64(1)
				return &zero
			}(),
		}

		out := &bytes.Buffer{}

		// create initially
		ds.Operation = wgpb.NatsKvOperation_NATSKV_CREATE
		err = ds.Load(context.Background(), []byte(`{"args":{"key":"key","value":"input"},"variables":{"key":"foo","input":{"token":"bar","org":{"id":1},"user":{"id":1}}}}`), out)
		assert.NoError(t, err)
		assert.Equal(t, `{"key":"foo","value":{"token":"bar","org":{"id":1},"user":{"id":1}},"revision":1,"created":1}`, out.String())

		// create again (should fail)
		out.Reset()
		ds.Operation = wgpb.NatsKvOperation_NATSKV_CREATE
		err = ds.Load(context.Background(), []byte(`{"args":{"key":"key","value":"input"},"variables":{"key":"foo","input":{"token":"bar","org":{"id":1},"user":{"id":1}}}}`), out)
		assert.NoError(t, err)
		assert.Equal(t, `null`, out.String())

		out.Reset()
		ds.Operation = wgpb.NatsKvOperation_NATSKV_PUT
		err = ds.Load(context.Background(), []byte(`{"args":{"key":"key","value":"input"},"variables":{"key":"foo","input":{"token":"bar","org":{"id":1},"user":{"id":2}}}}`), out)
		assert.NoError(t, err)
		assert.Equal(t, `{"key":"foo","value":{"token":"bar","org":{"id":1},"user":{"id":2}},"revision":2,"created":1}`, out.String())

		out.Reset()
		ds.Operation = wgpb.NatsKvOperation_NATSKV_GET
		err = ds.Load(context.Background(), []byte(`{"args":{"key":"key"},"variables":{"key":"foo"}}`), out)
		assert.NoError(t, err)
		assert.Equal(t, `{"key":"foo","value":{"token":"bar","org":{"id":1},"user":{"id":2}},"revision":2,"created":1}`, out.String())

		out.Reset()
		ds.Operation = wgpb.NatsKvOperation_NATSKV_DELETE
		err = ds.Load(context.Background(), []byte(`{"args":{"key":"key"},"variables":{"key":"foo"}}`), out)
		assert.NoError(t, err)
		assert.Equal(t, `true`, out.String())

		out.Reset()
		ds.Operation = wgpb.NatsKvOperation_NATSKV_GET
		err = ds.Load(context.Background(), []byte(`{"args":{"key":"key"},"variables":{"key":"foo"}}`), out)
		assert.NoError(t, err)
		assert.Equal(t, `null`, out.String())
	})
}
