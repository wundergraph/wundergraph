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
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/buger/jsonparser"
	"go.uber.org/zap"

	"github.com/wundergraph/graphql-go-tools/pkg/engine/datasource/graphql_datasource"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/datasource/staticdatasource"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"

	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/datasources/database"
	oas_datasource "github.com/wundergraph/wundergraph/pkg/datasources/oas"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type EngineConfigLoader struct {
	wundergraphDir string
	resolvers      []FactoryResolver
}

type FactoryResolver interface {
	Resolve(ds *wgpb.DataSourceConfiguration) (plan.PlannerFactory, error)
}

// Defined again here to avoid circular reference to apihandler.ApiTransportFactory

type ApiTransportFactory interface {
	RoundTripper(tripper http.RoundTripper, enableStreamingMode bool) http.RoundTripper
	DefaultTransportTimeout() time.Duration
}
type DefaultFactoryResolver struct {
	baseTransport    http.RoundTripper
	transportFactory ApiTransportFactory
	graphql          *graphql_datasource.Factory
	rest             *oas_datasource.Factory
	static           *staticdatasource.Factory
	database         *database.Factory
	hooksClient      *hooks.Client
}

func NewDefaultFactoryResolver(transportFactory ApiTransportFactory, baseTransport http.RoundTripper,
	debug bool, log *zap.Logger, hooksClient *hooks.Client) *DefaultFactoryResolver {

	defaultHttpClient := &http.Client{
		Timeout:   transportFactory.DefaultTransportTimeout(),
		Transport: transportFactory.RoundTripper(baseTransport, false),
	}
	streamingClient := &http.Client{
		Transport: transportFactory.RoundTripper(baseTransport, true),
	}

	return &DefaultFactoryResolver{
		baseTransport:    baseTransport,
		transportFactory: transportFactory,
		graphql: &graphql_datasource.Factory{
			HTTPClient:      defaultHttpClient,
			StreamingClient: streamingClient,
			BatchFactory:    graphql_datasource.NewBatchFactory(),
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
		hooksClient: hooksClient,
	}
}

// requiresCustomHTTPClient returns true iff the given FetchConfiguration requires a dedicated HTTP client
func (d *DefaultFactoryResolver) requiresCustomHTTPClient(ds *wgpb.DataSourceConfiguration, cfg *wgpb.FetchConfiguration) bool {
	// when a custom timeout is specified, we can't use the shared http.Client
	if ds != nil && ds.RequestTimeoutSeconds > 0 {
		return true
	}
	// when mTLS is enabled, we need to create a new client
	if cfg != nil && cfg.MTLS != nil {
		return true
	}
	return false
}

// customTLSRoundTripper returns a TLS http.Roundtripper with the given key and certificates loaded
func (d *DefaultFactoryResolver) customTLSRoundTripper(mTLS *wgpb.MTLSConfiguration) (http.RoundTripper, error) {
	privateKey := loadvariable.String(mTLS.Key)
	caCert := loadvariable.String(mTLS.Cert)

	if privateKey == "" || caCert == "" {
		return nil, errors.New("invalid key/cert in mTLS configuration")
	}

	caCertData := []byte(caCert)
	cert, err := tls.X509KeyPair(caCertData, []byte(privateKey))
	if err != nil {
		return nil, fmt.Errorf("unable to build key pair: %w", err)
	}

	dialer := &net.Dialer{
		Timeout:   10 * time.Second,
		KeepAlive: 90 * time.Second,
	}

	// building an empty pool of certificates means no other certificates are allowed
	// even if they are in the system trust store
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCertData)

	return &http.Transport{
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
	}, nil
}

// newHTTPClient returns a custom http.Client with the given FetchConfiguration applied. Configuration
// should have been previously validated by d.fetchConfigurationRequiresDedicatedHTTPClient()
func (d *DefaultFactoryResolver) newHTTPClient(ds *wgpb.DataSourceConfiguration, cfg *wgpb.FetchConfiguration) (*http.Client, error) {
	// Timeout
	timeout := d.transportFactory.DefaultTransportTimeout()
	if ds != nil && ds.RequestTimeoutSeconds > 0 {
		timeout = time.Duration(ds.RequestTimeoutSeconds) * time.Second
	}
	// TLS
	var transport http.RoundTripper
	var err error
	if cfg != nil && cfg.MTLS != nil {
		transport, err = d.customTLSRoundTripper(cfg.MTLS)
		if err != nil {
			return nil, err
		}
	} else {
		transport = d.baseTransport
	}
	return &http.Client{
		Timeout:   timeout,
		Transport: d.transportFactory.RoundTripper(transport, false),
	}, nil
}

func (d *DefaultFactoryResolver) onWsConnectionInitCallback(dataSourceID string) *graphql_datasource.OnWsConnectionInitCallback {
	var callback graphql_datasource.OnWsConnectionInitCallback = func(ctx context.Context, url string, header http.Header) (json.RawMessage, error) {
		payload := hooks.OnWsConnectionInitHookPayload{
			DataSourceID: dataSourceID,
			Request: hooks.WunderGraphRequest{
				RequestURI: url,
				Headers:    hooks.HeaderSliceToCSV(header),
			},
		}
		hookData, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}

		if user := authentication.UserFromContext(ctx); user != nil {
			if userJson, err := json.Marshal(user); err == nil {
				hookData, _ = jsonparser.Set(hookData, userJson, "__wg", "user")
			}
		}

		out, err := d.hooksClient.DoWsTransportRequest(ctx, hooks.WsTransportOnConnectionInit, hookData)
		if err != nil {
			return nil, err
		}

		resp := struct {
			Payload json.RawMessage `json:"payload"`
		}{}

		if err := json.Unmarshal(out.Response, &resp); err != nil {
			return nil, err
		}

		return resp.Payload, nil
	}

	return &callback
}

func (d *DefaultFactoryResolver) Resolve(ds *wgpb.DataSourceConfiguration) (plan.PlannerFactory, error) {
	switch ds.Kind {
	case wgpb.DataSourceKind_GRAPHQL:
		factory := &graphql_datasource.Factory{
			HTTPClient:      d.graphql.HTTPClient,
			StreamingClient: d.graphql.StreamingClient,
			BatchFactory:    d.graphql.BatchFactory,
		}

		if d.requiresCustomHTTPClient(ds, ds.CustomGraphql.Fetch) {
			client, err := d.newHTTPClient(ds, ds.CustomGraphql.Fetch)
			if err != nil {
				return nil, err
			}
			factory.HTTPClient = client
		}

		if ds.CustomGraphql.HooksConfiguration != nil && ds.CustomGraphql.HooksConfiguration.OnWSTransportConnectionInit {
			factory.OnWsConnectionInitCallback = d.onWsConnectionInitCallback(ds.Id)
		}

		return factory, nil
	case wgpb.DataSourceKind_REST:
		if d.requiresCustomHTTPClient(ds, ds.CustomRest.Fetch) {
			client, err := d.newHTTPClient(ds, ds.CustomRest.Fetch)
			if err != nil {
				return nil, err
			}
			return d.rest.WithHTTPClient(client), nil
		}
		return d.rest, nil
	case wgpb.DataSourceKind_STATIC:
		return d.static, nil
	case wgpb.DataSourceKind_POSTGRESQL,
		wgpb.DataSourceKind_MYSQL,
		wgpb.DataSourceKind_SQLSERVER,
		wgpb.DataSourceKind_MONGODB,
		wgpb.DataSourceKind_SQLITE,
		wgpb.DataSourceKind_PRISMA:
		if d.requiresCustomHTTPClient(ds, nil) {
			client, err := d.newHTTPClient(ds, nil)
			if err != nil {
				return nil, err
			}
			return d.database.WithHTTPClient(client), nil
		}
		return d.database, nil
	default:
		return nil, fmt.Errorf("invalid datasource kind %q", ds.Kind)
	}
}

func New(wundergraphDir string, resolvers ...FactoryResolver) *EngineConfigLoader {
	return &EngineConfigLoader{
		wundergraphDir: wundergraphDir,
		resolvers:      resolvers,
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

			fetchURL := buildFetchUrl(
				loadvariable.String(in.CustomRest.Fetch.GetUrl()),
				loadvariable.String(in.CustomRest.Fetch.GetBaseUrl()),
				loadvariable.String(in.CustomRest.Fetch.GetPath()))

			// resolves arguments like {{ .arguments.tld }} are allowed
			// unresolved arguments like {tld} are not allowed

			allowed := regexp.MustCompile(`\{\{[^\}]+\}\}`)
			withoutAllowedArgs := allowed.ReplaceAllString(fetchURL, "")
			disallowed := regexp.MustCompile(`\{.*\}`)
			if disallowed.MatchString(withoutAllowedArgs) {
				return nil, fmt.Errorf("fetchUrl %q contains a placeholder, which is not supported. Placeholders are only allowed when using a static string as the baseURL", fetchURL)
			}

			restConfig := oas_datasource.Configuration{
				Fetch: oas_datasource.FetchConfiguration{
					URL:           fetchURL,
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

			fetchUrl := buildFetchUrl(
				loadvariable.String(in.CustomGraphql.Fetch.GetUrl()),
				loadvariable.String(in.CustomGraphql.Fetch.GetBaseUrl()),
				loadvariable.String(in.CustomGraphql.Fetch.GetPath()),
			)

			subscriptionUrl := loadvariable.String(in.CustomGraphql.Subscription.Url)
			if subscriptionUrl == "" {
				subscriptionUrl = fetchUrl
			}

			customScalarTypeFields := make([]graphql_datasource.SingleTypeField, len(in.CustomGraphql.CustomScalarTypeFields))
			for i, v := range in.CustomGraphql.CustomScalarTypeFields {
				customScalarTypeFields[i] = graphql_datasource.SingleTypeField{
					TypeName:  v.TypeName,
					FieldName: v.FieldName,
				}
			}

			out.Custom = graphql_datasource.ConfigJson(graphql_datasource.Configuration{
				Fetch: graphql_datasource.FetchConfiguration{
					URL:    fetchUrl,
					Method: in.CustomGraphql.Fetch.Method.String(),
					Header: header,
				},
				Federation: graphql_datasource.FederationConfiguration{
					Enabled:    in.CustomGraphql.Federation.Enabled,
					ServiceSDL: in.CustomGraphql.Federation.ServiceSdl,
				},
				Subscription: graphql_datasource.SubscriptionConfiguration{
					URL:    subscriptionUrl,
					UseSSE: in.CustomGraphql.Subscription.UseSSE,
				},
				UpstreamSchema:         in.CustomGraphql.UpstreamSchema,
				CustomScalarTypeFields: customScalarTypeFields,
			})
		case wgpb.DataSourceKind_POSTGRESQL,
			wgpb.DataSourceKind_MYSQL,
			wgpb.DataSourceKind_SQLSERVER,
			wgpb.DataSourceKind_MONGODB,
			wgpb.DataSourceKind_SQLITE,
			wgpb.DataSourceKind_PRISMA:
			if in.CustomDatabase == nil {
				continue
			}
			databaseURL := loadvariable.String(in.CustomDatabase.DatabaseURL)
			config := database.Configuration{
				DatabaseURL:         databaseURL,
				PrismaSchema:        l.addDataSourceToPrismaSchema(in.CustomDatabase.PrismaSchema, databaseURL, in.Kind),
				GraphqlSchema:       in.CustomDatabase.GraphqlSchema,
				CloseTimeoutSeconds: in.CustomDatabase.CloseTimeoutSeconds,
				WunderGraphDir:      l.wundergraphDir,
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
			config.JsonInputVariables = append(config.JsonInputVariables, in.CustomDatabase.JsonInputVariables...)
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
	case wgpb.DataSourceKind_PRISMA:
		// on the prisma datasource, the datasource header is already present in the schema
		return schema
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

func buildFetchUrl(url, baseUrl, path string) string {
	if url != "" {
		return url
	}

	return fmt.Sprintf("%s/%s", strings.TrimSuffix(baseUrl, "/"), strings.TrimPrefix(path, "/"))
}
