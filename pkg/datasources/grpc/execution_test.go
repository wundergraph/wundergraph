package grpc

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"sync"
	"testing"

	"github.com/jensneuse/abstractlogger"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/graphql"
	"google.golang.org/grpc"

	starwarsGrpc "github.com/wundergraph/wundergraph/pkg/datasources/grpc/testdata/starwars"
)

type ExecutionEngineV2TestCase struct {
	schema                            *graphql.Schema
	operation                         func(t *testing.T) graphql.Request
	dataSources                       []plan.DataSourceConfiguration
	generateChildrenForFirstRootField bool
	fields                            plan.FieldConfigurations
	engineOptions                     []graphql.ExecutionOptionsV2
	expectedResponse                  string
}

func TestExecutionEngineV2_Execute(t *testing.T) {
	run := func(testCase ExecutionEngineV2TestCase, withError bool) func(t *testing.T) {
		return func(t *testing.T) {
			engineConf := graphql.NewEngineV2Configuration(testCase.schema)
			if testCase.generateChildrenForFirstRootField {
				for i := 0; i < len(testCase.dataSources); i++ {
					children := testCase.schema.GetAllNestedFieldChildrenFromTypeField(testCase.dataSources[i].RootNodes[0].TypeName, testCase.dataSources[i].RootNodes[0].FieldNames[0])
					testCase.dataSources[i].ChildNodes = make([]plan.TypeField, len(children))
					for j, child := range children {
						testCase.dataSources[i].ChildNodes[j] = plan.TypeField{
							TypeName:   child.TypeName,
							FieldNames: child.FieldNames,
						}
					}
				}
			}
			engineConf.SetDataSources(testCase.dataSources)
			engineConf.SetFieldConfigurations(testCase.fields)
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			engine, err := graphql.NewExecutionEngineV2(ctx, abstractlogger.Noop{}, engineConf)
			require.NoError(t, err)

			operation := testCase.operation(t)
			resultWriter := graphql.NewEngineResultWriter()
			execCtx, execCtxCancel := context.WithCancel(context.Background())
			defer execCtxCancel()
			err = engine.Execute(execCtx, &operation, &resultWriter, testCase.engineOptions...)

			actualResponse := resultWriter.String()
			assert.Equal(t, testCase.expectedResponse, actualResponse)

			if withError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		}
	}

	// runWithError := func(testCase ExecutionEngineV2TestCase) func(t *testing.T) {
	// 	return run(testCase, true)
	// }

	runWithoutError := func(testCase ExecutionEngineV2TestCase) func(t *testing.T) {
		return run(testCase, false)
	}

	t.Run("GRPC datasource", func(t *testing.T) {
		schema, err := graphql.NewSchemaFromString(starwarsGrpc.GrpcGeneratedSchema)
		require.NoError(t, err)

		s := grpc.NewServer()
		starwarsGrpc.RegisterStarwarsServiceServer(s, &starwarsGrpc.Server{})

		var grpcPort int
		if l, err := net.Listen("tcp", "127.0.0.1:0"); err != nil {
			panic(err)
		} else {
			grpcPort = l.Addr().(*net.TCPAddr).Port
			go func(t *testing.T) { require.NoError(t, s.Serve(l)) }(t)
		}
		defer s.Stop()

		t.Run("execute GetHero operation", runWithoutError(
			ExecutionEngineV2TestCase{
				schema: schema,
				operation: func(t *testing.T) graphql.Request {
					return graphql.Request{
						OperationName: "",
						Variables:     []byte(`{"episode": "NEWHOPE"}`),
						Query: `
						query GetHero($episode: starwars_Episode) {
							hero: starwars_StarwarsService_GetHero(input: {episode: $episode}){
								id
								name
							}
						}`,
					}
				},
				dataSources: []plan.DataSourceConfiguration{
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
							Endpoint: EndpointConfiguration{
								Package: "starwars",
								Service: "StarwarsService",
								Method:  "GetHero",
							},
							Server: ServerConfiguration{
								Protoset: starwarsGrpc.ProtoSet(t, "./testdata/starwars"),
								Target:   fmt.Sprintf("127.0.0.1:%d", grpcPort),
							},
						}),
						Factory: NewFactory(),
					},
				},
				fields: []plan.FieldConfiguration{
					{
						TypeName:              "Query",
						FieldName:             "starwars_StarwarsService_GetHero",
						DisableDefaultMapping: true,
					},
				},
				expectedResponse: `{"data":{"hero":{"id":"1","name":"Luke Skywalker"}}}`,
			},
		))
	})
}

func BenchmarkExecutionEngineV2_GRPC(b *testing.B) {
	s := grpc.NewServer()
	starwarsGrpc.RegisterStarwarsServiceServer(s, &starwarsGrpc.Server{})

	var grpcPort int
	if l, err := net.Listen("tcp", "127.0.0.1:0"); err != nil {
		panic(err)
	} else {
		grpcPort = l.Addr().(*net.TCPAddr).Port
		go func(t *testing.B) { require.NoError(t, s.Serve(l)) }(b)
	}
	defer s.Stop()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	type benchCase struct {
		engine *graphql.ExecutionEngineV2
		writer *graphql.EngineResultWriter
	}

	newEngine := func() *graphql.ExecutionEngineV2 {
		schema, err := graphql.NewSchemaFromString(starwarsGrpc.GrpcGeneratedSchema)
		require.NoError(b, err)

		engineConf := graphql.NewEngineV2Configuration(schema)
		engineConf.SetDataSources([]plan.DataSourceConfiguration{
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
					Endpoint: EndpointConfiguration{
						Package: "starwars",
						Service: "StarwarsService",
						Method:  "GetHero",
					},
					Server: ServerConfiguration{
						Protoset: starwarsGrpc.ProtoSet(b, "../engine/datasource/grpc_datasource/testdata/starwars"),
						Target:   fmt.Sprintf("127.0.0.1:%d", grpcPort),
						// Target: "127.0.0.1:9090",
					},
				}),
				Factory: NewFactory(),
			},
		})
		engineConf.SetFieldConfigurations([]plan.FieldConfiguration{
			{
				TypeName:              "Query",
				FieldName:             "starwars_StarwarsService_GetHero",
				DisableDefaultMapping: true,
			},
		})

		engine, err := graphql.NewExecutionEngineV2(ctx, abstractlogger.NoopLogger, engineConf)
		require.NoError(b, err)

		return engine
	}

	newBenchCase := func() *benchCase {
		writer := graphql.NewEngineResultWriter()
		return &benchCase{
			engine: newEngine(),
			writer: &writer,
		}
	}

	ctx = context.Background()
	req := graphql.Request{
		OperationName: "",
		Variables:     []byte(`{"episode": "NEWHOPE"}`),
		Query: `
			query GetHero($episode: starwars_Episode) {
				hero: starwars_StarwarsService_GetHero(input: {episode: $episode}){
					id
					name
				}
			}`,
	}

	writer := graphql.NewEngineResultWriter()
	engine := newEngine()
	require.NoError(b, engine.Execute(ctx, &req, &writer))
	require.Equal(b, `{"data":{"hero":{"id":"1","name":"Luke Skywalker"}}}`, writer.String())

	pool := sync.Pool{
		New: func() interface{} {
			return newBenchCase()
		},
	}

	b.SetBytes(int64(writer.Len()))
	b.ResetTimer()
	b.ReportAllocs()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			bc := pool.Get().(*benchCase)
			bc.writer.Reset()
			_ = bc.engine.Execute(ctx, &req, bc.writer)
			pool.Put(bc)
		}
	})

}
