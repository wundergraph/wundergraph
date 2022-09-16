package engineconfigloader

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/datasource/graphql_datasource"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/datasource/staticdatasource"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"

	"github.com/wundergraph/wundergraph/pkg/datasources/database"
	oas_datasource "github.com/wundergraph/wundergraph/pkg/datasources/oas"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type EngineConfigLoader struct {
	resolvers []FactoryResolver
}

type FactoryResolver interface {
	Resolve(ds *wgpb.DataSourceConfiguration) (plan.PlannerFactory, error)
}

type ApiTransportFactory func(tripper http.RoundTripper) http.RoundTripper

type DefaultFactoryResolver struct {
	baseTransport    http.RoundTripper
	transportFactory ApiTransportFactory
	graphql          *graphql_datasource.Factory
	rest             *oas_datasource.Factory
	static           *staticdatasource.Factory
	database         *database.Factory
}

func NewDefaultFactoryResolver(transportFactory ApiTransportFactory, baseTransport http.RoundTripper, debug bool, log abstractlogger.Logger) *DefaultFactoryResolver {
	defaultHttpClient := &http.Client{
		Timeout:   time.Second * 10,
		Transport: transportFactory(baseTransport),
	}
	return &DefaultFactoryResolver{
		baseTransport:    baseTransport,
		transportFactory: transportFactory,
		graphql: &graphql_datasource.Factory{
			HTTPClient:   defaultHttpClient,
			BatchFactory: graphql_datasource.NewBatchFactory(),
		},
		rest: &oas_datasource.Factory{
			Client: defaultHttpClient,
		},
		static: &staticdatasource.Factory{},
		database: &database.Factory{
			Client: defaultHttpClient,
			Debug:  debug,
			Log:    log,
		},
	}
}

// tryCreateHTTPSClient creates a http client with the given options or defaults to the standard client if no mTLS options are given
func (d *DefaultFactoryResolver) tryCreateHTTPSClient(mTLS *wgpb.MTLSConfiguration) (*http.Client, error) {
	privateKey := loadvariable.String(mTLS.Key)
	caCert := loadvariable.String(mTLS.Cert)

	if privateKey == "" || caCert == "" {
		return nil, errors.New("invalid key/cert in mTLS configuration")
	}

	caCertData := []byte(caCert)
	cert, err := tls.X509KeyPair(caCertData, []byte(privateKey))
	if err != nil {
		return nil, errors.New("unable to build key pair")
	}

	dialer := &net.Dialer{
		Timeout:   10 * time.Second,
		KeepAlive: 90 * time.Second,
	}

	// building an empty pool of certificates means no other certificates are allowed
	// even if they are in the system trust store
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCertData)

	mtlsTransport := &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			return dialer.DialContext(ctx, network, addr)
		},
		MaxIdleConns:        1024,
		IdleConnTimeout:     90 * time.Second,
		TLSHandshakeTimeout: 10 * time.Second,
		TLSClientConfig: &tls.Config{
			Certificates:       []tls.Certificate{cert},
			RootCAs:            caCertPool,
			InsecureSkipVerify: mTLS.InsecureSkipVerify,
		},
	}

	baseTransportWithMTLS := d.transportFactory(mtlsTransport)

	return &http.Client{
		Timeout:   time.Second * 10,
		Transport: baseTransportWithMTLS,
	}, nil

}

func (d *DefaultFactoryResolver) Resolve(ds *wgpb.DataSourceConfiguration) (plan.PlannerFactory, error) {
	switch ds.Kind {
	case wgpb.DataSourceKind_GRAPHQL:
		// when mTLS is enabled, we need to create a new client
		if ds.CustomGraphql != nil && ds.CustomGraphql.Fetch != nil && ds.CustomGraphql.Fetch.MTLS != nil {
			client, err := d.tryCreateHTTPSClient(ds.CustomGraphql.Fetch.MTLS)
			if err != nil {
				return nil, err
			}
			return &graphql_datasource.Factory{
				HTTPClient:   client,
				BatchFactory: graphql_datasource.NewBatchFactory(),
			}, nil
		}
		return d.graphql, nil
	case wgpb.DataSourceKind_REST:
		// when mTLS is enabled, we need to create a new client
		if ds.CustomRest != nil && ds.CustomRest.Fetch != nil && ds.CustomRest.Fetch.MTLS != nil {
			client, err := d.tryCreateHTTPSClient(ds.CustomRest.Fetch.MTLS)
			if err != nil {
				return nil, err
			}
			return &oas_datasource.Factory{
				Client: client,
			}, nil
		}
		return d.rest, nil
	case wgpb.DataSourceKind_STATIC:
		return d.static, nil
	case wgpb.DataSourceKind_POSTGRESQL,
		wgpb.DataSourceKind_MYSQL,
		wgpb.DataSourceKind_SQLSERVER,
		wgpb.DataSourceKind_MONGODB,
		wgpb.DataSourceKind_SQLITE:
		return d.database, nil
	default:
		return nil, fmt.Errorf("invalid datasource kind %q", ds.Kind)
	}
}

func New(resolvers ...FactoryResolver) *EngineConfigLoader {
	return &EngineConfigLoader{
		resolvers: resolvers,
	}
}

func (l *EngineConfigLoader) LoadJson(engineConfigJson json.RawMessage) (*plan.Configuration, error) {
	var engineConfig wgpb.EngineConfiguration
	err := json.Unmarshal(engineConfigJson, &engineConfig)
	if err != nil {
		return nil, err
	}
	return l.Load(engineConfig)
}

func (l *EngineConfigLoader) Load(engineConfig wgpb.EngineConfiguration) (*plan.Configuration, error) {
	var (
		outConfig plan.Configuration
	)

	outConfig.DefaultFlushIntervalMillis = engineConfig.DefaultFlushInterval
	for _, configuration := range engineConfig.FieldConfigurations {
		var args []plan.ArgumentConfiguration
		for _, argumentConfiguration := range configuration.ArgumentsConfiguration {
			arg := plan.ArgumentConfiguration{
				Name:       argumentConfiguration.Name,
				SourcePath: argumentConfiguration.SourcePath,
			}
			switch argumentConfiguration.SourceType {
			case wgpb.ArgumentSource_FIELD_ARGUMENT:
				arg.SourceType = plan.FieldArgumentSource
			case wgpb.ArgumentSource_OBJECT_FIELD:
				arg.SourceType = plan.ObjectFieldSource
			}
			switch argumentConfiguration.RenderConfiguration {
			case wgpb.ArgumentRenderConfiguration_RENDER_ARGUMENT_DEFAULT:
				arg.RenderConfig = plan.RenderArgumentDefault
			case wgpb.ArgumentRenderConfiguration_RENDER_ARGUMENT_AS_ARRAY_CSV:
				arg.RenderConfig = plan.RenderArgumentAsArrayCSV
			case wgpb.ArgumentRenderConfiguration_RENDER_ARGUMENT_AS_GRAPHQL_VALUE:
				arg.RenderConfig = plan.RenderArgumentAsGraphQLValue
			}
			args = append(args, arg)
		}
		outConfig.Fields = append(outConfig.Fields, plan.FieldConfiguration{
			TypeName:              configuration.TypeName,
			FieldName:             configuration.FieldName,
			DisableDefaultMapping: configuration.DisableDefaultFieldMapping,
			Path:                  configuration.Path,
			Arguments:             args,
			RequiresFields:        configuration.RequiresFields,
			UnescapeResponseJson:  configuration.UnescapeResponseJson,
		})
	}

	for _, configuration := range engineConfig.TypeConfigurations {
		outConfig.Types = append(outConfig.Types, plan.TypeConfiguration{
			TypeName: configuration.TypeName,
			RenameTo: configuration.RenameTo,
		})
	}

	for _, in := range engineConfig.DatasourceConfigurations {
		factory, err := l.resolveFactory(in)
		if err != nil {
			return nil, err
		}
		if factory == nil {
			continue
		}
		out := plan.DataSourceConfiguration{
			Factory: factory,
		}
		switch in.Kind {
		case wgpb.DataSourceKind_REST:
			header := http.Header{}
			for s, httpHeader := range in.CustomRest.Fetch.Header {
				for _, value := range httpHeader.Values {
					header.Add(s, loadvariable.String(value))
				}
			}
			var query []oas_datasource.QueryConfiguration
			for _, configuration := range in.CustomRest.Fetch.Query {
				query = append(query, oas_datasource.QueryConfiguration{
					Name:  configuration.Name,
					Value: configuration.Value,
				})
			}
			typeMappings := make([]oas_datasource.StatusCodeTypeMapping, len(in.CustomRest.StatusCodeTypeMappings))
			for i := range in.CustomRest.StatusCodeTypeMappings {
				typeMappings[i].StatusCode = int(in.CustomRest.StatusCodeTypeMappings[i].StatusCode)
				typeMappings[i].TypeNameStringBytes = []byte("\"" + in.CustomRest.StatusCodeTypeMappings[i].TypeName + "\"")
				typeMappings[i].InjectStatusCodeIntoResponse = in.CustomRest.StatusCodeTypeMappings[i].InjectStatusCodeIntoBody
				typeMappings[i].StatusCodeByteString = []byte(strconv.Itoa(int(in.CustomRest.StatusCodeTypeMappings[i].StatusCode)))
			}
			path := loadvariable.String(in.CustomRest.Fetch.GetPath())
			url := loadvariable.String(in.CustomRest.Fetch.GetUrl())
			if url == "" {
				url = in.CustomRest.Fetch.BaseUrl + path
			}
			restConfig := oas_datasource.Configuration{
				Fetch: oas_datasource.FetchConfiguration{
					URL:           url,
					Method:        in.CustomRest.Fetch.Method.String(),
					Header:        header,
					Query:         query,
					Body:          loadvariable.String(in.CustomRest.Fetch.Body),
					URLEncodeBody: in.CustomRest.Fetch.UrlEncodeBody,
				},
				Subscription: oas_datasource.SubscriptionConfiguration{
					PollingIntervalMillis:   in.CustomRest.Subscription.PollingIntervalMillis,
					SkipPublishSameResponse: in.CustomRest.Subscription.SkipPublishSameResponse,
				},
				DefaultTypeName:        in.CustomRest.DefaultTypeName,
				StatusCodeTypeMappings: typeMappings,
			}
			out.Custom = oas_datasource.ConfigJSON(restConfig)
		case wgpb.DataSourceKind_STATIC:
			out.Custom = staticdatasource.ConfigJSON(staticdatasource.Configuration{
				Data: loadvariable.String(in.CustomStatic.Data),
			})
		case wgpb.DataSourceKind_GRAPHQL:
			header := http.Header{}
			for s, httpHeader := range in.CustomGraphql.Fetch.Header {
				for _, value := range httpHeader.Values {
					header.Add(s, loadvariable.String(value))
				}
			}
			path := loadvariable.String(in.CustomGraphql.Fetch.GetPath())
			url := loadvariable.String(in.CustomGraphql.Fetch.GetUrl())
			subscriptionUrl := loadvariable.String(in.CustomGraphql.Subscription.Url)
			if url == "" {
				url = in.CustomGraphql.Fetch.BaseUrl + path
			}
			if subscriptionUrl == "" {
				subscriptionUrl = url
			}
			out.Custom = graphql_datasource.ConfigJson(graphql_datasource.Configuration{
				Fetch: graphql_datasource.FetchConfiguration{
					URL:    url,
					Method: in.CustomGraphql.Fetch.Method.String(),
					Header: header,
				},
				Federation: graphql_datasource.FederationConfiguration{
					Enabled:    in.CustomGraphql.Federation.Enabled,
					ServiceSDL: in.CustomGraphql.Federation.ServiceSdl,
				},
				Subscription: graphql_datasource.SubscriptionConfiguration{
					URL: subscriptionUrl,
				},
				UpstreamSchema: in.CustomGraphql.UpstreamSchema,
			})
		case wgpb.DataSourceKind_POSTGRESQL,
			wgpb.DataSourceKind_MYSQL,
			wgpb.DataSourceKind_SQLSERVER,
			wgpb.DataSourceKind_MONGODB,
			wgpb.DataSourceKind_SQLITE:
			if in.CustomDatabase == nil {
				continue
			}
			databaseURL := loadvariable.String(in.CustomDatabase.DatabaseURL)
			config := database.Configuration{
				DatabaseURL:         databaseURL,
				PrismaSchema:        l.addDataSourceToPrismaSchema(in.CustomDatabase.PrismaSchema, databaseURL, in.Kind),
				GraphqlSchema:       in.CustomDatabase.GraphqlSchema,
				CloseTimeoutSeconds: in.CustomDatabase.CloseTimeoutSeconds,
			}
			for _, field := range in.CustomDatabase.JsonTypeFields {
				config.JsonTypeFields = append(config.JsonTypeFields, database.SingleTypeField{
					TypeName:  field.TypeName,
					FieldName: field.FieldName,
				})
			}
			if config.CloseTimeoutSeconds == 0 {
				config.CloseTimeoutSeconds = 30
			}
			for _, variable := range in.CustomDatabase.JsonInputVariables {
				config.JsonInputVariables = append(config.JsonInputVariables, variable)
			}
			out.Custom = database.ConfigJson(config)
		default:
			continue
		}
		for _, node := range in.RootNodes {
			out.RootNodes = append(out.RootNodes, plan.TypeField{
				TypeName:   node.TypeName,
				FieldNames: node.FieldNames,
			})
		}
		for _, node := range in.ChildNodes {
			out.ChildNodes = append(out.ChildNodes, plan.TypeField{
				TypeName:   node.TypeName,
				FieldNames: node.FieldNames,
			})
		}
		for _, directive := range in.Directives {
			out.Directives = append(out.Directives, plan.DirectiveConfiguration{
				DirectiveName: directive.DirectiveName,
				RenameTo:      directive.DirectiveName,
			})
		}
		outConfig.DataSources = append(outConfig.DataSources, out)
	}

	return &outConfig, nil
}

func (l *EngineConfigLoader) resolveFactory(ds *wgpb.DataSourceConfiguration) (plan.PlannerFactory, error) {
	for i := range l.resolvers {
		factory, err := l.resolvers[i].Resolve(ds)
		if err != nil {
			return nil, err
		}
		if factory != nil {
			return factory, nil
		}
	}
	return nil, nil
}

func (l *EngineConfigLoader) addDataSourceToPrismaSchema(schema, databaseURL string, kind wgpb.DataSourceKind) string {
	var (
		provider string
	)
	switch kind {
	case wgpb.DataSourceKind_POSTGRESQL:
		provider = "postgresql"
	case wgpb.DataSourceKind_MONGODB:
		provider = "mongodb"
	case wgpb.DataSourceKind_MYSQL:
		provider = "mysql"
	case wgpb.DataSourceKind_SQLSERVER:
		provider = "sqlserver"
	case wgpb.DataSourceKind_SQLITE:
		provider = "sqlite"
	}
	if provider == "" {
		return schema
	}
	dataSource := fmt.Sprintf(`datasource db {
  url      = "%s"
  provider = "%s"
}

`, databaseURL, provider)
	return dataSource + schema
}
