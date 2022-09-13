package apihandler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/buger/jsonparser"
	"github.com/cespare/xxhash"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"github.com/hashicorp/go-uuid"
	"github.com/jensneuse/abstractlogger"
	"github.com/rs/cors"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
	"golang.org/x/sync/singleflight"

	"github.com/wundergraph/graphql-go-tools/pkg/ast"
	"github.com/wundergraph/graphql-go-tools/pkg/astparser"
	"github.com/wundergraph/graphql-go-tools/pkg/asttransform"
	"github.com/wundergraph/graphql-go-tools/pkg/astvalidation"
	"github.com/wundergraph/graphql-go-tools/pkg/astvisitor"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/datasource/introspection_datasource"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
	"github.com/wundergraph/graphql-go-tools/pkg/graphql"
	"github.com/wundergraph/graphql-go-tools/pkg/lexer/literal"
	"github.com/wundergraph/graphql-go-tools/pkg/operationreport"

	"github.com/wundergraph/wundergraph/internal/unsafebytes"
	"github.com/wundergraph/wundergraph/pkg/apicache"
	"github.com/wundergraph/wundergraph/pkg/apiconfig"
	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/engineconfigloader"
	"github.com/wundergraph/wundergraph/pkg/graphiql"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/inputvariables"
	"github.com/wundergraph/wundergraph/pkg/interpolate"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/postresolvetransform"
	"github.com/wundergraph/wundergraph/pkg/s3uploadclient"
	"github.com/wundergraph/wundergraph/pkg/webhookhandler"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	WG_PREFIX    = "wg_"
	WG_LIVE      = WG_PREFIX + "live"
	WG_VARIABLES = WG_PREFIX + "variables"
)

type Builder struct {
	router   *mux.Router
	loader   *engineconfigloader.EngineConfigLoader
	api      *wgpb.Api
	resolver *resolve.Resolver
	pool     *pool.Pool

	middlewareClient *hooks.Client
	hooksServerURL   string

	definition *ast.Document

	log abstractlogger.Logger

	planConfig plan.Configuration

	cache apicache.Cache

	insecureCookies     bool
	forceHttpsRedirects bool
	enableDebugMode     bool
	enableIntrospection bool
	devMode             bool

	renameTypeNames []resolve.RenameTypeName

	githubAuthDemoClientID     string
	githubAuthDemoClientSecret string
}

type BuilderConfig struct {
	InsecureCookies            bool
	ForceHttpsRedirects        bool
	EnableDebugMode            bool
	EnableIntrospection        bool
	GitHubAuthDemoClientID     string
	GitHubAuthDemoClientSecret string
	HookServerURL              string
	DevMode                    bool
}

func NewBuilder(pool *pool.Pool,
	log abstractlogger.Logger,
	loader *engineconfigloader.EngineConfigLoader,
	hooksClient *hooks.Client,
	config BuilderConfig,
) *Builder {
	return &Builder{
		loader:                     loader,
		log:                        log,
		pool:                       pool,
		insecureCookies:            config.InsecureCookies,
		middlewareClient:           hooksClient,
		hooksServerURL:             config.HookServerURL,
		forceHttpsRedirects:        config.ForceHttpsRedirects,
		enableDebugMode:            config.EnableDebugMode,
		enableIntrospection:        config.EnableIntrospection,
		githubAuthDemoClientID:     config.GitHubAuthDemoClientID,
		githubAuthDemoClientSecret: config.GitHubAuthDemoClientSecret,
		devMode:                    config.DevMode,
	}
}

func (r *Builder) BuildAndMountApiHandler(ctx context.Context, router *mux.Router, api *wgpb.Api) (streamClosers []chan struct{}, err error) {

	if api.CacheConfig != nil {
		err = r.configureCache(api)
		if err != nil {
			return streamClosers, err
		}
	}

	r.router = r.createSubRouter(router, api.PathPrefix)

	for _, webhook := range api.Webhooks {
		err = r.registerWebhook(webhook, api.PathPrefix)
		if err != nil {
			r.log.Error("register webhook", abstractlogger.Error(err))
		}
	}

	if api.EngineConfiguration == nil {
		// no engine config, skipping configuration
		return streamClosers, nil
	}
	if api.AuthenticationConfig == nil ||
		api.AuthenticationConfig.Hooks == nil {
		return streamClosers, fmt.Errorf("authentication config missing")
	}

	planConfig, err := r.loader.Load(*api.EngineConfiguration)
	if err != nil {
		return streamClosers, err
	}

	r.api = api
	r.planConfig = *planConfig
	r.resolver = resolve.New(ctx, resolve.NewFetcher(true), true)

	definition, report := astparser.ParseGraphqlDocumentString(api.EngineConfiguration.GraphqlSchema)
	if report.HasErrors() {
		return streamClosers, report
	}
	r.definition = &definition
	err = asttransform.MergeDefinitionWithBaseSchema(r.definition)
	if err != nil {
		return streamClosers, err
	}

	if r.enableIntrospection {
		introspectionFactory, err := introspection_datasource.NewIntrospectionConfigFactory(r.definition)
		if err != nil {
			return streamClosers, err
		}
		fieldConfigs := introspectionFactory.BuildFieldConfigurations()
		r.planConfig.Fields = append(r.planConfig.Fields, fieldConfigs...)
		dataSource := introspectionFactory.BuildDataSourceConfiguration()
		r.planConfig.DataSources = append(r.planConfig.DataSources, dataSource)
	}

	// limiter := rate.NewLimiter(rate.Every(time.Second), 10)

	r.log.Debug("configuring API",
		abstractlogger.String("name", api.PathPrefix),
		abstractlogger.Int("numOfOperations", len(api.Operations)),
	)

	if len(api.Hosts) > 0 {
		r.router.Use(func(handler http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				for i := range api.Hosts {
					if r.Host == api.Hosts[i] {
						handler.ServeHTTP(w, r)
						return
					}
				}
				http.Error(w, fmt.Sprintf("Host not found: %s", r.Host), http.StatusNotFound)
			})
		})
	}

	r.router.Use(func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
			if r.enableDebugMode {
				requestDump, err := httputil.DumpRequest(request, true)
				if err == nil {
					fmt.Printf("\n\n--- ClientRequest start ---\n\n%s\n\n\n\n--- ClientRequest end ---\n\n",
						string(requestDump),
					)
				}
			}
			handler.ServeHTTP(w, request)
		})
	})

	if api.CorsConfiguration != nil {
		corsMiddleware := cors.New(cors.Options{
			MaxAge:           int(api.CorsConfiguration.MaxAge),
			AllowCredentials: api.CorsConfiguration.AllowCredentials,
			AllowedHeaders:   api.CorsConfiguration.AllowedHeaders,
			AllowedMethods:   api.CorsConfiguration.AllowedMethods,
			AllowedOrigins:   loadvariable.Strings(api.CorsConfiguration.AllowedOrigins),
			ExposedHeaders:   api.CorsConfiguration.ExposedHeaders,
		})
		r.router.Use(func(handler http.Handler) http.Handler {
			return corsMiddleware.Handler(handler)
		})
		r.log.Debug("configuring CORS",
			abstractlogger.String("api", api.PathPrefix),
			abstractlogger.Strings("allowedOrigins", loadvariable.Strings(api.CorsConfiguration.AllowedOrigins)),
		)
	}

	r.registerAuth(api.PathPrefix, r.insecureCookies)

	for _, s3Provider := range api.S3UploadConfiguration {
		s3, err := s3uploadclient.NewS3UploadClient(loadvariable.String(s3Provider.Endpoint),
			s3uploadclient.Options{
				BucketName:      loadvariable.String(s3Provider.BucketName),
				BucketLocation:  loadvariable.String(s3Provider.BucketLocation),
				AccessKeyID:     loadvariable.String(s3Provider.AccessKeyID),
				SecretAccessKey: loadvariable.String(s3Provider.SecretAccessKey),
				UseSSL:          s3Provider.UseSSL,
			},
		)
		if err != nil {
			r.log.Error("registerS3UploadClient", abstractlogger.Error(err))
		} else {
			s3Path := fmt.Sprintf("/s3/%s/upload", s3Provider.Name)
			r.router.Handle(s3Path, http.HandlerFunc(s3.UploadFile))
			r.log.Debug("register S3 provider", abstractlogger.String("provider", s3Provider.Name))
			r.log.Debug("register S3 endpoint", abstractlogger.String("path", path.Join(r.api.PathPrefix, s3Path)))
		}
	}

	// RenameTo is the correct name for the origin
	// for the downstream (client), we have to reverse the __typename fields
	// this is why Types.RenameTo is assigned to rename.From
	for _, configuration := range planConfig.Types {
		r.renameTypeNames = append(r.renameTypeNames, resolve.RenameTypeName{
			From: []byte(configuration.RenameTo),
			To:   []byte(configuration.TypeName),
		})
	}

	for _, operation := range api.Operations {
		err = r.registerOperation(operation)
		if err != nil {
			r.log.Error("registerOperation", abstractlogger.Error(err))
		}
	}

	if api.EnableGraphqlEndpoint {
		graphqlHandler := &GraphQLHandler{
			planConfig:      r.planConfig,
			definition:      r.definition,
			resolver:        r.resolver,
			log:             r.log,
			pool:            r.pool,
			sf:              &singleflight.Group{},
			prepared:        map[uint64]planWithExtractedVariables{},
			preparedMux:     &sync.RWMutex{},
			renameTypeNames: r.renameTypeNames,
		}
		apiPath := "/graphql"
		r.router.Methods(http.MethodPost, http.MethodOptions).Path(apiPath).Handler(graphqlHandler)
		r.log.Debug("registered GraphQLHandler",
			abstractlogger.String("method", http.MethodPost),
			abstractlogger.String("path", path.Join(api.PathPrefix, apiPath)),
		)

		graphqlPlaygroundHandler := &GraphQLPlaygroundHandler{
			log:           r.log,
			html:          graphiql.GetGraphiqlPlaygroundHTML(),
			apiPathPrefix: api.GetPathPrefix(),
		}
		r.router.Methods(http.MethodGet, http.MethodOptions).Path(apiPath).Handler(graphqlPlaygroundHandler)
		r.log.Debug("registered GraphQLPlaygroundHandler",
			abstractlogger.String("method", http.MethodGet),
			abstractlogger.String("path", path.Join(api.PathPrefix, apiPath)),
		)

	}

	return streamClosers, err
}

func mergeRequiredFields(fields plan.FieldConfigurations, fieldsRequired plan.FieldConfigurations) plan.FieldConfigurations {
WithNext:
	for _, required := range fieldsRequired {
		for i := range fields {
			if required.TypeName == fields[i].TypeName && required.FieldName == fields[i].FieldName {
			NextRequired:
				for _, add := range required.RequiresFields {
					for _, ex := range fields[i].RequiresFields {
						if ex == add {
							continue NextRequired
						}
					}
					fields[i].RequiresFields = append(fields[i].RequiresFields, add)
				}
				continue WithNext
			}
		}
		fields = append(fields, required)
	}
	return fields
}

func (r *Builder) createSubRouter(router *mux.Router, pathPrefix string) *mux.Router {

	route := router.NewRoute()

	// add api path prefix
	prefix := fmt.Sprintf("/%s", pathPrefix)
	route.PathPrefix(prefix)

	r.log.Debug("create sub router",
		abstractlogger.String("pathPrefix", prefix),
	)

	return route.Subrouter()
}

func (r *Builder) registerWebhook(config *wgpb.WebhookConfiguration, pathPrefix string) error {
	handler, err := webhookhandler.New(config, pathPrefix, r.hooksServerURL, r.log)
	if err != nil {
		return err
	}
	webhookPath := fmt.Sprintf("/webhooks/%s", config.Name)
	r.router.
		Methods(http.MethodPost, http.MethodGet).
		Path(webhookPath).
		Handler(handler)
	return nil
}

func (r *Builder) registerOperation(operation *wgpb.Operation) error {

	if operation.Internal {
		return nil
	}

	apiPath := fmt.Sprintf("/operations/%s", operation.Name)

	var (
		operationIsConfigured bool
	)

	defer func() {
		if !operationIsConfigured {
			route := r.router.Methods(http.MethodGet, http.MethodPost, http.MethodOptions).Path(apiPath)
			route.Handler(&EndpointUnavailableHandler{
				OperationName: operation.Name,
			})
			r.log.Error("EndpointUnavailableHandler",
				abstractlogger.String("Operation", operation.Name),
				abstractlogger.String("Endpoint", apiPath),
				abstractlogger.String("Help", "The Operation is not properly configured. This usually happens when there is a mismatch between GraphQL Schema and Operation. Please make sure, the Operation is valid. This can be supported best by enabling intellisense for GraphQL within your IDE."),
			)
		}
	}()

	shared := r.pool.GetShared(context.Background(), r.planConfig, pool.Config{})

	shared.Doc.Input.ResetInputString(operation.Content)
	shared.Parser.Parse(shared.Doc, shared.Report)

	if shared.Report.HasErrors() {
		return shared.Report
	}

	shared.Normalizer.NormalizeNamedOperation(shared.Doc, r.definition, []byte(operation.Name), shared.Report)

	state := shared.Validation.Validate(shared.Doc, r.definition, shared.Report)
	if state != astvalidation.Valid {
		return shared.Report
	}

	preparedPlan := shared.Planner.Plan(shared.Doc, r.definition, operation.Name, shared.Report)
	shared.Postprocess.Process(preparedPlan)

	operationType := getOperationType(shared.Doc, r.definition, operation.Name)

	variablesValidator, err := inputvariables.NewValidator(r.cleanupJsonSchema(operation.VariablesSchema), r.enableDebugMode)
	if err != nil {
		return err
	}

	queryParamsAllowList := r.generateQueryArgumentsAllowList(operation.VariablesSchema)

	stringInterpolator, err := interpolate.NewStringInterpolator(r.cleanupJsonSchema(operation.VariablesSchema))
	if err != nil {
		return err
	}

	jsonStringInterpolator, err := interpolate.NewStringInterpolatorJSONOnly(r.cleanupJsonSchema(operation.InterpolationVariablesSchema))
	if err != nil {
		return err
	}

	postResolveTransformer := postresolvetransform.NewTransformer(operation.PostResolveTransformations)

	switch operationType {
	case ast.OperationTypeQuery:
		synchronousPlan, ok := preparedPlan.(*plan.SynchronousResponsePlan)
		if !ok {
			break
		}
		handler := &QueryHandler{
			resolver:               r.resolver,
			log:                    r.log,
			preparedPlan:           synchronousPlan,
			pool:                   r.pool,
			extractedVariables:     make([]byte, len(shared.Doc.Input.Variables)),
			cache:                  r.cache,
			configHash:             []byte(r.api.ApiConfigHash),
			operation:              operation,
			variablesValidator:     variablesValidator,
			hooksClient:            r.middlewareClient,
			hooksConfig:            buildHooksConfig(operation),
			rbacEnforcer:           authentication.NewRBACEnforcer(operation),
			stringInterpolator:     stringInterpolator,
			jsonStringInterpolator: jsonStringInterpolator,
			postResolveTransformer: postResolveTransformer,
			renameTypeNames:        r.renameTypeNames,
			queryParamsAllowList:   queryParamsAllowList,
		}

		if operation.LiveQueryConfig != nil && operation.LiveQueryConfig.Enable {
			handler.liveQuery = liveQueryConfig{
				enabled:                true,
				pollingIntervalSeconds: operation.LiveQueryConfig.PollingIntervalSeconds,
			}
		}

		if operation.CacheConfig != nil && operation.CacheConfig.Enable {
			handler.cacheConfig = cacheConfig{
				enable:               operation.CacheConfig.Enable,
				maxAge:               operation.CacheConfig.MaxAge,
				public:               operation.CacheConfig.Public,
				staleWhileRevalidate: operation.CacheConfig.StaleWhileRevalidate,
			}
		}

		copy(handler.extractedVariables, shared.Doc.Input.Variables)

		route := r.router.Methods(http.MethodGet, http.MethodOptions).Path(apiPath)
		if operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired {
			route.Handler(authentication.RequiresAuthentication(handler))
		} else {
			route.Handler(handler)
		}

		operationIsConfigured = true

		r.log.Debug("registered QueryHandler",
			abstractlogger.String("method", http.MethodGet),
			abstractlogger.String("path", path.Join(r.api.PathPrefix, apiPath)),
			abstractlogger.Bool("mock", operation.HooksConfiguration.MockResolve.Enable),
			abstractlogger.Bool("cacheEnabled", handler.cacheConfig.enable),
			abstractlogger.Int("cacheMaxAge", int(handler.cacheConfig.maxAge)),
			abstractlogger.Int("cacheStaleWhileRevalidate", int(handler.cacheConfig.staleWhileRevalidate)),
			abstractlogger.Bool("cachePublic", handler.cacheConfig.public),
			abstractlogger.Bool("authRequired", operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired),
		)
	case ast.OperationTypeMutation:
		synchronousPlan, ok := preparedPlan.(*plan.SynchronousResponsePlan)
		if !ok {
			break
		}
		handler := &MutationHandler{
			resolver:               r.resolver,
			log:                    r.log,
			preparedPlan:           synchronousPlan,
			pool:                   r.pool,
			extractedVariables:     make([]byte, len(shared.Doc.Input.Variables)),
			operation:              operation,
			variablesValidator:     variablesValidator,
			hooksClient:            r.middlewareClient,
			hooksConfig:            buildHooksConfig(operation),
			rbacEnforcer:           authentication.NewRBACEnforcer(operation),
			stringInterpolator:     stringInterpolator,
			jsonStringInterpolator: jsonStringInterpolator,
			postResolveTransformer: postResolveTransformer,
			renameTypeNames:        r.renameTypeNames,
		}
		copy(handler.extractedVariables, shared.Doc.Input.Variables)
		route := r.router.Methods(http.MethodPost, http.MethodOptions).Path(apiPath)

		if operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired {
			route.Handler(authentication.RequiresAuthentication(handler))
		} else {
			route.Handler(handler)
		}

		operationIsConfigured = true

		r.log.Debug("registered MutationHandler",
			abstractlogger.String("method", http.MethodPost),
			abstractlogger.String("path", path.Join(r.api.PathPrefix, apiPath)),
			abstractlogger.Bool("mock", operation.HooksConfiguration.MockResolve.Enable),
			abstractlogger.Bool("authRequired", operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired),
		)
	case ast.OperationTypeSubscription:
		subscriptionPlan, ok := preparedPlan.(*plan.SubscriptionResponsePlan)
		if !ok {
			break
		}
		handler := &SubscriptionHandler{
			resolver:               r.resolver,
			log:                    r.log,
			preparedPlan:           subscriptionPlan,
			pool:                   r.pool,
			extractedVariables:     make([]byte, len(shared.Doc.Input.Variables)),
			operation:              operation,
			variablesValidator:     variablesValidator,
			rbacEnforcer:           authentication.NewRBACEnforcer(operation),
			stringInterpolator:     stringInterpolator,
			jsonStringInterpolator: jsonStringInterpolator,
			postResolveTransformer: postResolveTransformer,
			renameTypeNames:        r.renameTypeNames,
			queryParamsAllowList:   queryParamsAllowList,
		}
		copy(handler.extractedVariables, shared.Doc.Input.Variables)
		route := r.router.Methods(http.MethodGet, http.MethodOptions).Path(apiPath)

		if operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired {
			route.Handler(authentication.RequiresAuthentication(handler))
		} else {
			route.Handler(handler)
		}

		operationIsConfigured = true

		r.log.Debug("registered SubscriptionHandler",
			abstractlogger.String("method", http.MethodGet),
			abstractlogger.String("path", path.Join(r.api.PathPrefix, apiPath)),
			abstractlogger.Bool("mock", operation.HooksConfiguration.MockResolve.Enable),
			abstractlogger.Bool("authRequired", operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired),
		)
	case ast.OperationTypeUnknown:
		r.log.Debug("operation type unknown",
			abstractlogger.String("name", operation.Name),
			abstractlogger.String("content", operation.Content),
		)
	}

	return nil
}

func (r *Builder) generateQueryArgumentsAllowList(schema string) []string {
	var allowList []string
	schema = r.cleanupJsonSchema(schema)
	_ = jsonparser.ObjectEach([]byte(schema), func(key []byte, value []byte, dataType jsonparser.ValueType, offset int) error {
		allowList = append(allowList, string(key))
		return nil
	}, "properties")
	return allowList
}

func (r *Builder) cleanupJsonSchema(schema string) string {
	schema = strings.Replace(schema, "/definitions/", "/$defs/", -1)
	schema = strings.Replace(schema, "\"definitions\"", "\"$defs\"", -1)
	return schema
}

func (r *Builder) configureCache(api *wgpb.Api) (err error) {
	config := api.CacheConfig
	switch config.Kind {
	case wgpb.ApiCacheKind_IN_MEMORY_CACHE:
		r.log.Debug("configureCache",
			abstractlogger.String("primaryHost", api.PrimaryHost),
			abstractlogger.String("pathPrefix", api.PathPrefix),
			abstractlogger.String("deploymentID", api.DeploymentId),
			abstractlogger.String("cacheKind", config.Kind.String()),
			abstractlogger.Int("cacheSize", int(config.InMemoryConfig.MaxSize)),
		)
		r.cache, err = apicache.NewInMemory(config.InMemoryConfig.MaxSize)
		return
	case wgpb.ApiCacheKind_REDIS_CACHE:

		redisAddr := os.Getenv(config.RedisConfig.RedisUrlEnvVar)

		r.log.Debug("configureCache",
			abstractlogger.String("primaryHost", api.PrimaryHost),
			abstractlogger.String("pathPrefix", api.PathPrefix),
			abstractlogger.String("deploymentID", api.DeploymentId),
			abstractlogger.String("cacheKind", config.Kind.String()),
			abstractlogger.String("envVar", config.RedisConfig.RedisUrlEnvVar),
			abstractlogger.String("redisAddr", redisAddr),
		)

		r.cache, err = apicache.NewRedis(redisAddr, r.log)
		return
	default:
		r.log.Debug("configureCache",
			abstractlogger.String("primaryHost", api.PrimaryHost),
			abstractlogger.String("pathPrefix", api.PathPrefix),
			abstractlogger.String("deploymentID", api.DeploymentId),
			abstractlogger.String("cacheKind", config.Kind.String()),
		)
		r.cache = &apicache.NoOpCache{}
		return
	}
}

type GraphQLPlaygroundHandler struct {
	log           abstractlogger.Logger
	html          string
	apiPathPrefix string
}

func (h *GraphQLPlaygroundHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	protocol := "http"
	if r.TLS != nil {
		protocol = "https"
	}

	apiURL := protocol + "://" + path.Join(r.Host, h.apiPathPrefix)

	tpl := strings.Replace(h.html, "{{apiURL}}", apiURL, 1)
	resp := []byte(tpl)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Length", strconv.Itoa(len(resp)))
	_, _ = w.Write(resp)
}

type GraphQLHandler struct {
	planConfig plan.Configuration
	definition *ast.Document
	resolver   *resolve.Resolver
	log        abstractlogger.Logger
	pool       *pool.Pool
	sf         *singleflight.Group

	prepared    map[uint64]planWithExtractedVariables
	preparedMux *sync.RWMutex

	renameTypeNames []resolve.RenameTypeName
}

type planWithExtractedVariables struct {
	preparedPlan plan.Plan
	variables    []byte
}

var (
	errInvalid = errors.New("invalid")
)

func (h *GraphQLHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)
	_, err := io.Copy(buf, r.Body)
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	body := buf.Bytes()

	requestQuery, _ := jsonparser.GetString(body, "query")
	requestOperationName, parsedOperationNameDataType, _, _ := jsonparser.Get(body, "operationName")
	requestVariables, _, _, _ := jsonparser.Get(body, "variables")

	// An operationName set to { "operationName": null } will be parsed by 'jsonparser' to "null" string
	// and this will make the planner unable to find the operation to execute in selectOperation step.
	// to ensure that the operationName match what planner expect we set it to null.
	if parsedOperationNameDataType == jsonparser.Null {
		requestOperationName = nil
	}

	shared := h.pool.GetSharedFromRequest(context.Background(), r, h.planConfig, pool.Config{
		RenameTypeNames: h.renameTypeNames,
	})
	defer h.pool.PutShared(shared)

	shared.Ctx.Variables = requestVariables
	shared.Ctx.Context = r.Context()
	shared.Ctx.Request.Header = r.Header
	shared.Doc.Input.ResetInputString(requestQuery)
	shared.Parser.Parse(shared.Doc, shared.Report)

	if shared.Report.HasErrors() {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	_, _ = shared.Hash.Write(requestOperationName)

	err = shared.Printer.Print(shared.Doc, h.definition, shared.Hash)
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if shared.Report.HasErrors() {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	operationHash := shared.Hash.Sum64()

	h.preparedMux.RLock()
	prepared, exists := h.prepared[operationHash]
	h.preparedMux.RUnlock()
	if !exists {
		prepared, err = h.preparePlan(operationHash, requestOperationName, shared)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
	}

	if len(prepared.variables) != 0 {
		shared.Ctx.Variables = MergeJsonRightIntoLeft(shared.Ctx.Variables, prepared.variables)
	}

	switch p := prepared.preparedPlan.(type) {
	case *plan.SynchronousResponsePlan:
		w.Header().Set("Content-Type", "application/json")

		executionBuf := pool.GetBytesBuffer()
		defer pool.PutBytesBuffer(executionBuf)

		err := h.resolver.ResolveGraphQLResponse(shared.Ctx, p.Response, nil, executionBuf)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				return
			}
			h.log.Error("ResolveGraphQLResponse", abstractlogger.Error(err))
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		_, err = executionBuf.WriteTo(w)
		if err != nil {
			h.log.Error("respond to client", abstractlogger.Error(err))
			return
		}
	case *plan.SubscriptionResponsePlan:
		flushWriter, ok := getFlushWriter(shared.Ctx, r, w)
		if !ok {
			http.Error(w, "Connection not flushable", http.StatusBadRequest)
			return
		}

		err := h.resolver.ResolveGraphQLSubscription(shared.Ctx, p.Response, flushWriter)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				return
			}
			h.log.Error("ResolveGraphQLSubscription", abstractlogger.Error(err))
			return
		}
	case *plan.StreamingResponsePlan:
		http.Error(w, "not implemented", http.StatusNotFound)
	}
}

func (h *GraphQLHandler) preparePlan(operationHash uint64, requestOperationName []byte, shared *pool.Shared) (planWithExtractedVariables, error) {
	preparedPlan, err, _ := h.sf.Do(strconv.Itoa(int(operationHash)), func() (interface{}, error) {
		if len(requestOperationName) == 0 {
			shared.Normalizer.NormalizeOperation(shared.Doc, h.definition, shared.Report)
		} else {
			shared.Normalizer.NormalizeNamedOperation(shared.Doc, h.definition, requestOperationName, shared.Report)
		}

		state := shared.Validation.Validate(shared.Doc, h.definition, shared.Report)
		if state != astvalidation.Valid {
			return nil, errInvalid
		}

		preparedPlan := shared.Planner.Plan(shared.Doc, h.definition, unsafebytes.BytesToString(requestOperationName), shared.Report)
		shared.Postprocess.Process(preparedPlan)

		prepared := planWithExtractedVariables{
			preparedPlan: preparedPlan,
			variables:    make([]byte, len(shared.Doc.Input.Variables)),
		}

		copy(prepared.variables, shared.Doc.Input.Variables)

		h.preparedMux.Lock()
		h.prepared[operationHash] = prepared
		h.preparedMux.Unlock()

		return prepared, nil
	})
	if err != nil {
		return planWithExtractedVariables{}, err
	}
	return preparedPlan.(planWithExtractedVariables), nil
}

func postProcessVariables(operation *wgpb.Operation, r *http.Request, variables []byte) []byte {
	variables = injectClaims(operation, r, variables)
	variables = injectVariables(operation, r, variables)
	return variables
}

func injectClaims(operation *wgpb.Operation, r *http.Request, variables []byte) []byte {
	if operation.AuthorizationConfig == nil || len(operation.AuthorizationConfig.Claims) == 0 {
		return variables
	}
	user := authentication.UserFromContext(r.Context())
	if user == nil {
		return variables
	}
	for _, claim := range operation.AuthorizationConfig.Claims {
		switch claim.Claim {
		case wgpb.Claim_USERID:
			variables, _ = jsonparser.Set(variables, []byte("\""+user.UserID+"\""), claim.VariableName)
		case wgpb.Claim_EMAIL:
			variables, _ = jsonparser.Set(variables, []byte("\""+user.Email+"\""), claim.VariableName)
		case wgpb.Claim_EMAIL_VERIFIED:
			if user.EmailVerified {
				variables, _ = jsonparser.Set(variables, []byte("true"), claim.VariableName)
			} else {
				variables, _ = jsonparser.Set(variables, []byte("false"), claim.VariableName)
			}
		case wgpb.Claim_LOCATION:
			variables, _ = jsonparser.Set(variables, []byte("\""+user.Location+"\""), claim.VariableName)
		case wgpb.Claim_NAME:
			variables, _ = jsonparser.Set(variables, []byte("\""+user.Name+"\""), claim.VariableName)
		case wgpb.Claim_NICKNAME:
			variables, _ = jsonparser.Set(variables, []byte("\""+user.NickName+"\""), claim.VariableName)
		case wgpb.Claim_PROVIDER:
			variables, _ = jsonparser.Set(variables, []byte("\n"+user.ProviderID+"\""), claim.VariableName)
		}
	}
	return variables
}

func injectVariables(operation *wgpb.Operation, r *http.Request, variables []byte) []byte {
	if operation.VariablesConfiguration == nil || operation.VariablesConfiguration.InjectVariables == nil {
		return variables
	}
	for i := range operation.VariablesConfiguration.InjectVariables {
		key := operation.VariablesConfiguration.InjectVariables[i].VariableName
		kind := operation.VariablesConfiguration.InjectVariables[i].VariableKind
		switch kind {
		case wgpb.InjectVariableKind_UUID:
			id, _ := uuid.GenerateUUID()
			variables, _ = jsonparser.Set(variables, []byte("\""+id+"\""), key)
		case wgpb.InjectVariableKind_DATE_TIME:
			format := operation.VariablesConfiguration.InjectVariables[i].DateFormat
			now := time.Now()
			dateTime := now.Format(format)
			variables, _ = jsonparser.Set(variables, []byte("\""+dateTime+"\""), key)
		case wgpb.InjectVariableKind_ENVIRONMENT_VARIABLE:
			value := os.Getenv(operation.VariablesConfiguration.InjectVariables[i].EnvironmentVariableName)
			if value == "" {
				continue
			}
			variables, _ = jsonparser.Set(variables, []byte("\""+value+"\""), key)
		}
	}
	return variables
}

type cacheConfig struct {
	enable               bool
	maxAge               int64
	public               bool
	staleWhileRevalidate int64
}

type QueryResolver interface {
	ResolveGraphQLResponse(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte, writer io.Writer) (err error)
}

type liveQueryConfig struct {
	enabled                bool
	pollingIntervalSeconds int64
}

type hooksConfig struct {
	mockResolve         mockResolveConfig
	preResolve          bool
	postResolve         bool
	mutatingPreResolve  bool
	mutatingPostResolve bool
	customResolve       bool
}

type mockResolveConfig struct {
	enable                            bool
	subscriptionPollingIntervalMillis int64
}

func buildHooksConfig(operation *wgpb.Operation) hooksConfig {
	if operation == nil || operation.HooksConfiguration == nil {
		return hooksConfig{}
	}
	config := operation.HooksConfiguration
	return hooksConfig{
		mockResolve: mockResolveConfig{
			enable:                            config.MockResolve.Enable,
			subscriptionPollingIntervalMillis: config.MockResolve.SubscriptionPollingIntervalMillis,
		},
		preResolve:          config.PreResolve,
		postResolve:         config.PostResolve,
		mutatingPreResolve:  config.MutatingPreResolve,
		mutatingPostResolve: config.MutatingPostResolve,
		customResolve:       config.CustomResolve,
	}
}

func parseQueryVariables(r *http.Request, allowList []string) []byte {
	rawVariables := r.URL.Query().Get(WG_VARIABLES)
	if rawVariables == "" {
		rawVariables = "{}"
		for name, val := range r.URL.Query() {
			if len(val) > 0 && !strings.HasPrefix(name, WG_PREFIX) {
				if !stringSliceContainsValue(allowList, name) {
					continue
				}
				// check if the user work with JSON values
				if gjson.Valid(val[0]) {
					rawVariables, _ = sjson.SetRaw(rawVariables, name, val[0])
				} else {
					rawVariables, _ = sjson.Set(rawVariables, name, val[0])
				}
			}
		}
	}
	return unsafebytes.StringToBytes(rawVariables)
}

func stringSliceContainsValue(list []string, value string) bool {
	for i := range list {
		if list[i] == value {
			return true
		}
	}
	return false
}

type QueryHandler struct {
	resolver               QueryResolver
	log                    abstractlogger.Logger
	preparedPlan           *plan.SynchronousResponsePlan
	extractedVariables     []byte
	pool                   *pool.Pool
	cacheConfig            cacheConfig
	cache                  apicache.Cache
	configHash             []byte
	liveQuery              liveQueryConfig
	operation              *wgpb.Operation
	variablesValidator     *inputvariables.Validator
	hooksClient            *hooks.Client
	hooksConfig            hooksConfig
	rbacEnforcer           *authentication.RBACEnforcer
	stringInterpolator     *interpolate.StringInterpolator
	jsonStringInterpolator *interpolate.StringInterpolator
	postResolveTransformer *postresolvetransform.Transformer
	renameTypeNames        []resolve.RenameTypeName
	queryParamsAllowList   []string
}

func (h *QueryHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	r = setOperationMetaData(r, h.operation)

	if proceed := h.rbacEnforcer.Enforce(r); !proceed {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var (
		cacheKey     string
		cacheIsStale = false
	)

	isLive := h.liveQuery.enabled && r.URL.Query().Get(WG_LIVE) == "true"

	buf := pool.GetBytesBuffer()
	ctx := pool.GetCtx(r, r, pool.Config{
		RenameTypeNames: h.renameTypeNames,
	})

	defer func() {

		if cacheIsStale {
			buf.Reset()
			ctx.Context = context.WithValue(context.Background(), "user", authentication.UserFromContext(r.Context()))
			err := h.resolver.ResolveGraphQLResponse(ctx, h.preparedPlan.Response, nil, buf)
			if err == nil {
				bufferedData := buf.Bytes()
				cacheData := make([]byte, len(bufferedData))
				copy(cacheData, bufferedData)
				h.cache.SetWithTTL(cacheKey, cacheData, time.Second*time.Duration(h.cacheConfig.maxAge+h.cacheConfig.staleWhileRevalidate))
			}
		}

		pool.PutCtx(ctx)
		pool.PutBytesBuffer(buf)
	}()

	ctx.Variables = parseQueryVariables(r, h.queryParamsAllowList)
	ctx.Variables = h.stringInterpolator.Interpolate(ctx.Variables)

	valid := h.variablesValidator.Validate(ctx, ctx.Variables)
	if !valid {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	compactBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(compactBuf)
	err := json.Compact(compactBuf, ctx.Variables)
	if err != nil {
		h.log.Error("Could not compact variables in query handler", abstractlogger.Bool("isLive", isLive))
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	ctx.Variables = compactBuf.Bytes()

	ctx.Variables = h.jsonStringInterpolator.Interpolate(ctx.Variables)

	if len(h.extractedVariables) != 0 {
		ctx.Variables = MergeJsonRightIntoLeft(ctx.Variables, h.extractedVariables)
	}

	ctx.Variables = postProcessVariables(h.operation, r, ctx.Variables)

	flusher, flusherOk := w.(http.Flusher)
	if isLive {
		if !flusherOk {
			h.log.Error("Could not flush in query handler", abstractlogger.Bool("isLive", isLive))
			http.Error(w, "requires flushing", http.StatusBadRequest)
			return
		}
		setSubscriptionHeaders(w)
		flusher.Flush()
	} else {
		w.Header().Set("Content-Type", "application/json")
	}

	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	if h.hooksConfig.mockResolve.enable {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MockResolve, hookData)
		if err != nil {
			h.log.Error("MockResolve query hook", abstractlogger.Error(err), abstractlogger.Bool("isLive", isLive))
			http.Error(w, "MockResolve query hook failed", http.StatusInternalServerError)
			return
		}

		if out != nil {
			_, _ = w.Write(out.Response)
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			h.log.Error("MockResolve query hook response is empty", abstractlogger.Bool("isLive", isLive))
			http.Error(w, "MockResolve query hook response is empty", http.StatusInternalServerError)
			return
		}
		return
	}

	if isLive {
		h.handleLiveQuery(r, w, ctx, buf, flusher)
		return
	}

	if h.cacheConfig.enable {
		cacheKey = string(h.configHash) + r.RequestURI
		item, hit := h.cache.Get(ctx.Context, cacheKey)
		if hit {

			w.Header().Set("X-Cache", "HIT")

			_, _ = buf.Write(item.Data)

			hash := xxhash.New()
			_, _ = hash.Write(h.configHash)
			_, _ = hash.Write(buf.Bytes())
			ETag := fmt.Sprintf("W/\"%d\"", hash.Sum64())

			w.Header()["ETag"] = []string{ETag}

			if h.cacheConfig.public {
				w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d, stale-while-revalidate=%d", h.cacheConfig.maxAge, h.cacheConfig.staleWhileRevalidate))
			} else {
				w.Header().Set("Cache-Control", fmt.Sprintf("private, max-age=%d, stale-while-revalidate=%d", h.cacheConfig.maxAge, h.cacheConfig.staleWhileRevalidate))
			}

			age := item.Age()
			w.Header().Set("Age", fmt.Sprintf("%d", age))

			if age > h.cacheConfig.maxAge {
				cacheIsStale = true
			}

			ifNoneMatch := r.Header.Get("If-None-Match")
			if ifNoneMatch == ETag {
				w.WriteHeader(http.StatusNotModified)
				return
			}

			w.WriteHeader(http.StatusOK)
			_, _ = buf.WriteTo(w)
			return
		}
		w.Header().Set("X-Cache", "MISS")
	}

	if h.hooksConfig.preResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PreResolve, hookData)
		if err != nil {
			h.log.Error("PreResolve query hook failed", abstractlogger.Error(err))
			http.Error(w, "PreResolve query hook failed", http.StatusInternalServerError)
			return
		}
		if out != nil {
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			h.log.Error("PreResolve query hook response is empty")
			http.Error(w, "PreResolve query hook response is empty", http.StatusInternalServerError)
			return
		}
	}

	if h.hooksConfig.mutatingPreResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPreResolve, hookData)
		if err != nil {
			h.log.Error("MutatingPreResolve query hook failed", abstractlogger.Error(err))
			http.Error(w, "MutatingPreResolve query hook failed", http.StatusInternalServerError)
			return
		}
		if out != nil {
			ctx.Variables = out.Input
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			h.log.Error("MutatingPreResolve query hook response is empty")
			http.Error(w, "MutatingPreResolve query hook response is empty", http.StatusInternalServerError)
			return
		}
	}

	if h.hooksConfig.customResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.CustomResolve, hookData)
		if err != nil {
			h.log.Error("CustomResolve query hook failed", abstractlogger.Error(err))
			http.Error(w, "CustomResolve query hook failed", http.StatusBadRequest)
			return
		}
		if out != nil {
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			h.log.Error("CustomResolve query hook response is empty")
			http.Error(w, "CustomResolve query hook response is empty", http.StatusInternalServerError)
			return
		}
		// when the hook is skipped
		if !bytes.Equal(out.Response, literal.NULL) {
			h.log.Debug("CustomResolve is skipped and empty response is written")
			_, _ = w.Write(out.Response)
			return
		}
	}

	err = h.resolver.ResolveGraphQLResponse(ctx, h.preparedPlan.Response, nil, buf)
	if err != nil {
		h.log.Error("ResolveGraphQLResponse for query failed", abstractlogger.Error(err))
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	transformed, err := h.postResolveTransformer.Transform(buf.Bytes())
	if err != nil {
		h.log.Error("Transform postResolve for query failed", abstractlogger.Error(err))
		http.Error(w, "Transform postResolve for query failed", http.StatusInternalServerError)
		return
	}

	if h.hooksConfig.postResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		_, err = h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PostResolve, hookData)
		if err != nil {
			h.log.Error("PostResolve query hook response is empty", abstractlogger.Error(err))
			http.Error(w, "PostResolve query hook response is empty", http.StatusInternalServerError)
			return
		}
	}

	if h.hooksConfig.mutatingPostResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPostResolve, hookData)
		if err != nil {
			h.log.Error("MutatingPostResolve query hook failed", abstractlogger.Error(err))
			http.Error(w, "MutatingPostResolve query hook failed", http.StatusInternalServerError)
			return
		}
		if out == nil {
			h.log.Error("MutatingPostResolve query hook response is empty")
			http.Error(w, "MutatingPostResolve query hook response is empty", http.StatusInternalServerError)
			return
		}
		transformed = out.Response
	}

	hash := xxhash.New()
	_, _ = hash.Write(h.configHash)
	_, _ = hash.Write(transformed)
	ETag := fmt.Sprintf("W/\"%d\"", hash.Sum64())

	w.Header()["ETag"] = []string{ETag}

	if h.cacheConfig.enable {
		if h.cacheConfig.public {
			w.Header().Set("Cache-Control", fmt.Sprintf("public, max-age=%d, stale-while-revalidate=%d", h.cacheConfig.maxAge, h.cacheConfig.staleWhileRevalidate))
		} else {
			w.Header().Set("Cache-Control", fmt.Sprintf("private, max-age=%d, stale-while-revalidate=%d", h.cacheConfig.maxAge, h.cacheConfig.staleWhileRevalidate))
		}

		w.Header().Set("Age", "0")

		cacheData := make([]byte, len(transformed))
		copy(cacheData, transformed)

		h.cache.SetWithTTL(cacheKey, cacheData, time.Second*time.Duration(h.cacheConfig.maxAge+h.cacheConfig.staleWhileRevalidate))
	}

	ifNoneMatch := r.Header.Get("If-None-Match")
	if ifNoneMatch == ETag {
		w.WriteHeader(http.StatusNotModified)
		return
	}

	reader := bytes.NewReader(transformed)
	_, err = reader.WriteTo(w)
	if err != nil {
		h.log.Error("Could not write response in query handler", abstractlogger.Error(err))
		http.Error(w, "Could not write response in query handler", http.StatusInternalServerError)
		return
	}
}

func (h *QueryHandler) handleLiveQueryEvent(ctx *resolve.Context, r *http.Request, requestBuf *bytes.Buffer, hookBuf *bytes.Buffer) ([]byte, error) {
	if h.hooksConfig.preResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PreResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("PreResolve liveQuery hook failed: %w", err)
		}
		if out != nil {
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			return nil, errors.New("PreResolve liveQuery hook response is empty")
		}
	}

	if h.hooksConfig.mutatingPreResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPreResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("LiveQueryHandler.MutatingPreResolve hook failed: %w", err)
		}
		if out != nil {
			ctx.Variables = out.Input
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			h.log.Error("MutatingPreResolve liveQuery hook response is empty")
		}
	}

	if h.hooksConfig.customResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.CustomResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("CustomResolve liveQuery hook failed: %w", err)
		}
		if out != nil {
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			return nil, errors.New("CustomResolve liveQuery hook response is empty")
		}
		// when the hook is skipped
		if !bytes.Equal(out.Response, literal.NULL) {
			h.log.Debug("CustomResolve is skipped and empty response is written")
			return out.Response, nil
		}
	}

	requestBuf.Reset()
	err := h.resolver.ResolveGraphQLResponse(ctx, h.preparedPlan.Response, nil, requestBuf)
	if err != nil {
		return nil, fmt.Errorf("ResolveGraphQLResponse liveQuery hook failed: %w", err)
	}

	transformed, err := h.postResolveTransformer.Transform(requestBuf.Bytes())
	if err != nil {
		return nil, fmt.Errorf("PostResolveTransformer liveQuery failed: %w", err)
	}
	if h.hooksConfig.postResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		_, err = h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PostResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("PostResolve liveQuery hook failed: %w", err)
		}
	}

	if h.hooksConfig.mutatingPostResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPostResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("MutatingPostResolve liveQuery hook failed: %w", err)
		}
		if out == nil {
			return nil, errors.New("MutatingPostResolve liveQuery hook response is empty")
		}
		transformed = out.Response
	}

	return transformed, nil
}

func (h *QueryHandler) handleLiveQuery(r *http.Request, w http.ResponseWriter, ctx *resolve.Context, requestBuf *bytes.Buffer, flusher http.Flusher) {
	subscribeOnce := r.URL.Query().Get("wg_subscribe_once") == "true"
	sse := r.URL.Query().Get("wg_sse") == "true"

	done := ctx.Context.Done()
	hash := xxhash.New()

	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	var lastHash uint64
	for {
		var hookError bool
		response, err := h.handleLiveQueryEvent(ctx, r, requestBuf, hookBuf)
		if err != nil {
			hookError = true
			h.log.Error("HandleLiveQueryEvent failed", abstractlogger.Error(err))
			graphqlError := graphql.Response{
				Errors: graphql.RequestErrors{
					graphql.RequestError{
						Message: err.Error(),
					},
				},
			}
			graphqlErrorPayload, marshalErr := graphqlError.Marshal()
			if marshalErr != nil {
				h.log.Error("HandleLiveQueryEvent could not marshal graphql error", abstractlogger.Error(marshalErr))
			} else {
				response = graphqlErrorPayload
			}
		}

		hash.Reset()
		_, _ = hash.Write(response)
		nextHash := hash.Sum64()

		// only send the response if the content has changed
		if nextHash != lastHash {
			lastHash = nextHash

			reader := bytes.NewReader(response)
			if sse {
				_, _ = w.Write([]byte("data: "))
			}
			_, err := reader.WriteTo(w)
			if subscribeOnce {
				flusher.Flush()
				return
			}
			_, err = w.Write(literal.LINETERMINATOR)
			_, err = w.Write(literal.LINETERMINATOR)
			if err != nil {
				return
			}
			flusher.Flush()
		}

		// After hook error we return the graphql compatible error to the client
		// and abort the stream
		if hookError {
			h.log.Error("HandleLiveQueryEvent cancel due to hook error", abstractlogger.Error(err))
			return
		}

		select {
		case <-done:
			return
		case <-time.After(time.Second * time.Duration(h.liveQuery.pollingIntervalSeconds)):
			continue
		}
	}
}

type MutationHandler struct {
	resolver               *resolve.Resolver
	log                    abstractlogger.Logger
	preparedPlan           *plan.SynchronousResponsePlan
	extractedVariables     []byte
	pool                   *pool.Pool
	operation              *wgpb.Operation
	variablesValidator     *inputvariables.Validator
	hooksClient            *hooks.Client
	hooksConfig            hooksConfig
	rbacEnforcer           *authentication.RBACEnforcer
	stringInterpolator     *interpolate.StringInterpolator
	jsonStringInterpolator *interpolate.StringInterpolator
	postResolveTransformer *postresolvetransform.Transformer
	renameTypeNames        []resolve.RenameTypeName
}

func (h *MutationHandler) parseFormVariables(r *http.Request) []byte {
	rawVariables := "{}"
	if err := r.ParseForm(); err == nil {
		for name, val := range r.Form {
			if len(val) == 0 || strings.HasSuffix(val[0], WG_PREFIX) {
				continue
			}
			// check if the user works with JSON values
			if gjson.Valid(val[0]) {
				rawVariables, _ = sjson.SetRaw(rawVariables, name, val[0])
			} else {
				rawVariables, _ = sjson.Set(rawVariables, name, val[0])
			}
		}
	}
	return []byte(rawVariables)
}

func (h *MutationHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	r = setOperationMetaData(r, h.operation)

	if proceed := h.rbacEnforcer.Enforce(r); !proceed {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	variablesBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(variablesBuf)

	ctx := pool.GetCtx(r, r, pool.Config{
		RenameTypeNames: h.renameTypeNames,
	})
	defer pool.PutCtx(ctx)

	ct := r.Header.Get("Content-Type")

	if ct == "application/x-www-form-urlencoded" {
		ctx.Variables = h.parseFormVariables(r)
	} else {
		_, err := io.Copy(variablesBuf, r.Body)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		ctx.Variables = variablesBuf.Bytes()
	}

	if len(ctx.Variables) == 0 {
		ctx.Variables = []byte("{}")
	}
	ctx.Variables = h.stringInterpolator.Interpolate(ctx.Variables)
	valid := h.variablesValidator.Validate(ctx, ctx.Variables)
	if !valid {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	compactBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(compactBuf)
	err := json.Compact(compactBuf, ctx.Variables)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	ctx.Variables = compactBuf.Bytes()

	ctx.Variables = h.jsonStringInterpolator.Interpolate(ctx.Variables)

	if len(h.extractedVariables) != 0 {
		ctx.Variables = MergeJsonRightIntoLeft(ctx.Variables, h.extractedVariables)
	}

	ctx.Variables = postProcessVariables(h.operation, r, ctx.Variables)

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	if h.hooksConfig.mockResolve.enable {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MockResolve, hookData)
		if err != nil {
			h.log.Error("MockResolve mutation hook", abstractlogger.Error(err))
			http.Error(w, "MockResolve mutation hook failed", http.StatusInternalServerError)
			return
		}
		_, _ = w.Write(out.Response)
		return
	}

	if h.hooksConfig.preResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PreResolve, hookData)
		if err != nil {
			h.log.Error("PreResolve mutation hook", abstractlogger.Error(err))
			http.Error(w, "PreResolve mutation hook failed", http.StatusInternalServerError)
			return
		}
		if out != nil {
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			h.log.Error("PreResolve mutation hook response is empty")
			http.Error(w, "PreResolve mutation hook response is empty", http.StatusInternalServerError)
			return
		}
	}

	if h.hooksConfig.mutatingPreResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPreResolve, hookData)
		if err != nil {
			h.log.Error("MutatingPostResolve mutation hook", abstractlogger.Error(err))
			http.Error(w, "MutatingPostResolve mutation hook failed", http.StatusInternalServerError)
			return
		}

		if out != nil {
			ctx.Variables = out.Input
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			h.log.Error("MutatingPostResolve mutation hook response is empty")
			http.Error(w, "MutatingPostResolve mutation hook response is empty", http.StatusInternalServerError)
			return
		}
	}

	if h.hooksConfig.customResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.CustomResolve, hookData)
		if err != nil {
			h.log.Error("CustomResolve mutation hook", abstractlogger.Error(err))
			http.Error(w, "CustomResolve mutation hook failed", http.StatusInternalServerError)
			return
		}
		if out != nil {
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			h.log.Error("CustomResolve mutation hook response is empty")
			http.Error(w, "CustomResolve mutation hook response is empty", http.StatusInternalServerError)
			return
		}
		// when the hook is skipped
		if !bytes.Equal(out.Response, literal.NULL) {
			h.log.Debug("CustomResolve is skipped and empty response is written")
			_, _ = w.Write(out.Response)
			return
		}
	}

	resolveErr := h.resolver.ResolveGraphQLResponse(ctx, h.preparedPlan.Response, nil, buf)
	if resolveErr != nil {
		h.log.Error("ResolveGraphQLResponse for mutation failed", abstractlogger.Error(resolveErr))
		http.Error(w, "ResolveGraphQLResponse for mutation failed", http.StatusInternalServerError)
		return
	}

	transformed, err := h.postResolveTransformer.Transform(buf.Bytes())
	if err != nil {
		h.log.Error("PostResolveTransformer mutation hook failed", abstractlogger.Error(err))
		http.Error(w, "PostResolveTransformer mutation hook failed", http.StatusInternalServerError)
		return
	}

	if h.hooksConfig.postResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		_, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PostResolve, hookData)
		if err != nil {
			h.log.Error("PostResolve mutation hook", abstractlogger.Error(err))
			http.Error(w, "PostResolve mutation hook failed", http.StatusInternalServerError)
			return
		}
	}

	if h.hooksConfig.mutatingPostResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPostResolve, hookData)
		if err != nil {
			h.log.Error("MutatingPostResolve query hook failed", abstractlogger.Error(err))
			http.Error(w, "MutatingPostResolve query hook failed", http.StatusInternalServerError)
			return
		}
		if out == nil {
			h.log.Error("MutatingPostResolve mutation hook response is empty")
			http.Error(w, "MutatingPostResolve mutation hook response is empty", http.StatusInternalServerError)
			return
		}
		transformed = out.Response
	}

	reader := bytes.NewReader(transformed)
	_, err = reader.WriteTo(w)
	if err != nil {
		h.log.Error("Could not write response in mutation handler", abstractlogger.Error(err))
		http.Error(w, "Could not write response in mutation handler", http.StatusInternalServerError)
		return
	}
}

type SubscriptionHandler struct {
	resolver               *resolve.Resolver
	log                    abstractlogger.Logger
	preparedPlan           *plan.SubscriptionResponsePlan
	extractedVariables     []byte
	pool                   *pool.Pool
	operation              *wgpb.Operation
	variablesValidator     *inputvariables.Validator
	rbacEnforcer           *authentication.RBACEnforcer
	stringInterpolator     *interpolate.StringInterpolator
	jsonStringInterpolator *interpolate.StringInterpolator
	postResolveTransformer *postresolvetransform.Transformer
	renameTypeNames        []resolve.RenameTypeName
	queryParamsAllowList   []string
}

func (h *SubscriptionHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	r = setOperationMetaData(r, h.operation)

	if proceed := h.rbacEnforcer.Enforce(r); !proceed {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := pool.GetCtx(r, r, pool.Config{
		RenameTypeNames: h.renameTypeNames,
	})
	defer pool.PutCtx(ctx)

	flushWriter, ok := getFlushWriter(ctx, r, w)
	if !ok {
		http.Error(w, "Connection not flushable", http.StatusBadRequest)
		return
	}

	ctx.Variables = parseQueryVariables(r, h.queryParamsAllowList)
	ctx.Variables = h.stringInterpolator.Interpolate(ctx.Variables)
	valid := h.variablesValidator.Validate(ctx, ctx.Variables)
	if !valid {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	compactBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(compactBuf)
	err := json.Compact(compactBuf, ctx.Variables)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	ctx.Variables = compactBuf.Bytes()

	ctx.Variables = h.jsonStringInterpolator.Interpolate(ctx.Variables)

	if len(h.extractedVariables) != 0 {
		ctx.Variables = MergeJsonRightIntoLeft(ctx.Variables, h.extractedVariables)
	}

	ctx.Variables = postProcessVariables(h.operation, r, ctx.Variables)

	err = h.resolver.ResolveGraphQLSubscription(ctx, h.preparedPlan.Response, flushWriter)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			return
		}
		h.log.Error("ResolveGraphQLSubscription", abstractlogger.Error(err))
		return
	}
}

func getOperationType(operation, definition *ast.Document, operationName string) ast.OperationType {

	walker := astvisitor.NewWalker(8)
	visitor := &operationKindVisitor{
		walker:        &walker,
		operationName: operationName,
	}

	walker.RegisterEnterDocumentVisitor(visitor)
	walker.RegisterEnterOperationVisitor(visitor)

	var report operationreport.Report
	walker.Walk(operation, definition, &report)
	return visitor.operationType
}

type operationKindVisitor struct {
	operationName         string
	operation, definition *ast.Document
	walker                *astvisitor.Walker
	operationType         ast.OperationType
}

func (o *operationKindVisitor) EnterDocument(operation, definition *ast.Document) {
	o.operation, o.definition = operation, definition
}

func (o *operationKindVisitor) EnterOperationDefinition(ref int) {
	name := o.operation.OperationDefinitionNameString(ref)
	if name != o.operationName {
		o.walker.SkipNode()
		return
	}
	o.operationType = o.operation.OperationDefinitions[ref].OperationType
	o.walker.Stop()
}

type httpFlushWriter struct {
	writer                 io.Writer
	flusher                http.Flusher
	postResolveTransformer *postresolvetransform.Transformer
	subscribeOnce          bool
	sse                    bool
	close                  func()
	sseBuf                 *bytes.Buffer
}

func (f *httpFlushWriter) Write(p []byte) (n int, err error) {
	if f.postResolveTransformer != nil {
		p, err = f.postResolveTransformer.Transform(p)
		if err != nil {
			return 0, err
		}
	}
	if f.sse {
		if f.sseBuf == nil {
			f.sseBuf = &bytes.Buffer{}
		}
		if f.sseBuf.Len() == 0 {
			f.sseBuf.WriteString("data: ")
		}
		return f.sseBuf.Write(p)
	}
	return f.writer.Write(p)
}

func (f *httpFlushWriter) Flush() {
	if f.sse && f.sseBuf != nil {
		_, _ = f.sseBuf.WriteTo(f.writer)
		f.sseBuf.Reset()
	}
	if f.subscribeOnce {
		f.flusher.Flush()
		f.close()
		return
	}
	_, _ = f.writer.Write([]byte("\n\n"))
	f.flusher.Flush()
}

// MergeJsonRightIntoLeft merges the right JSON into the left JSON while overriding the left side
func MergeJsonRightIntoLeft(left, right []byte) []byte {
	if left == nil {
		return right
	}
	if right == nil {
		return left
	}
	result := gjson.ParseBytes(right)
	result.ForEach(func(key, value gjson.Result) bool {
		left, _ = sjson.SetRawBytes(left, key.Str, unsafebytes.StringToBytes(value.Raw))
		return true
	})
	return left
}

func (r *Builder) registerAuth(pathPrefix string, insecureCookies bool) {

	var (
		hashKey, blockKey, csrfSecret []byte
		jwksProviders                 []*wgpb.JwksAuthProvider
	)

	if h := loadvariable.String(r.api.AuthenticationConfig.CookieBased.HashKey); h != "" {
		hashKey = []byte(h)
	}

	if b := loadvariable.String(r.api.AuthenticationConfig.CookieBased.BlockKey); b != "" {
		blockKey = []byte(b)
	}

	if b := loadvariable.String(r.api.AuthenticationConfig.CookieBased.CsrfSecret); b != "" {
		csrfSecret = []byte(b)
	}

	if apiconfig.HasCookieAuthEnabled(r.api) && (hashKey == nil || blockKey == nil || csrfSecret == nil) {
		panic("hashkey, blockkey, csrfsecret invalid: This should never have happened, validation didn't detect broken configuration, someone broke the validation code")
	}

	cookie := securecookie.New(hashKey, blockKey)

	if r.api.AuthenticationConfig.JwksBased != nil {
		jwksProviders = r.api.AuthenticationConfig.JwksBased.Providers
	}

	loadUserConfig := authentication.LoadUserConfig{
		Log:           r.log,
		Cookie:        cookie,
		JwksProviders: jwksProviders,
		Hooks: authentication.Hooks{
			Client:                     r.middlewareClient,
			MutatingPostAuthentication: r.api.AuthenticationConfig.Hooks.MutatingPostAuthentication,
			PostAuthentication:         r.api.AuthenticationConfig.Hooks.PostAuthentication,
			Log:                        r.log,
		},
	}

	r.router.Use(authentication.NewLoadUserMw(loadUserConfig))
	r.router.Use(authentication.NewCSRFMw(authentication.CSRFConfig{
		Path:            pathPrefix,
		InsecureCookies: insecureCookies,
		Secret:          csrfSecret,
	}))

	tokenBasedAuth := r.router.PathPrefix("/auth/token").Subrouter()

	tokenBasedAuth.Path("/user").Methods(http.MethodGet, http.MethodOptions).Handler(&authentication.TokenUserHandler{})

	cookieBasedAuth := r.router.PathPrefix("/auth/cookie").Subrouter()

	cookieBasedAuth.Path("/user").Methods(http.MethodGet, http.MethodOptions).Handler(&authentication.CookieUserHandler{
		HasRevalidateHook: r.api.AuthenticationConfig.Hooks.RevalidateAuthentication,
		MWClient:          r.middlewareClient,
		Log:               r.log,
		InsecureCookies:   insecureCookies,
		Cookie:            cookie,
	})
	cookieBasedAuth.Path("/csrf").Methods(http.MethodGet, http.MethodOptions).Handler(&authentication.CSRFTokenHandler{})

	r.registerCookieAuthHandlers(cookieBasedAuth, cookie, pathPrefix)
}

func (r *Builder) registerCookieAuthHandlers(router *mux.Router, cookie *securecookie.SecureCookie, pathPrefix string) {

	router.Path("/user/logout").Methods(http.MethodGet, http.MethodOptions).Handler(&authentication.UserLogoutHandler{
		InsecureCookies:                  r.insecureCookies,
		OpenIDConnectIssuersToLogoutURLs: r.configureOpenIDConnectIssuerLogoutURLs(),
	})

	if r.api.AuthenticationConfig == nil || r.api.AuthenticationConfig.CookieBased == nil {
		return
	}

	for _, provider := range r.api.AuthenticationConfig.CookieBased.Providers {
		r.configureCookieProvider(router, provider, cookie, pathPrefix)
	}
}

func (r *Builder) configureOpenIDConnectIssuerLogoutURLs() map[string]string {
	issuerLogoutURLs := map[string]string{}

	client := &http.Client{
		Timeout: time.Second * 10,
	}

	for _, provider := range r.api.AuthenticationConfig.CookieBased.Providers {
		if provider.Kind != wgpb.AuthProviderKind_AuthProviderOIDC {
			continue
		}
		if provider.OidcConfig == nil {
			continue
		}
		issuer := loadvariable.String(provider.OidcConfig.Issuer)
		if issuer == "" {
			r.log.Error("oidc issuer must not be empty",
				abstractlogger.String("providerID", provider.Id),
			)
			continue
		}
		_, urlErr := url.ParseRequestURI(issuer)
		if urlErr != nil {
			r.log.Error("invalid oidc issuer, must be a valid URL",
				abstractlogger.String("providerID", provider.Id),
				abstractlogger.String("issuer", issuer),
				abstractlogger.Error(urlErr),
			)
			continue
		}

		issuer = strings.TrimSuffix(issuer, "/")

		introspectionURL := issuer + "/.well-known/openid-configuration"
		req, err := http.NewRequest(http.MethodGet, introspectionURL, nil)
		if err != nil {
			r.log.Error("failed to create openid-configuration request",
				abstractlogger.Error(err),
			)
			continue
		}
		resp, err := client.Do(req)
		if err != nil {
			r.log.Error("failed to get openid-configuration",
				abstractlogger.Error(err),
			)
			continue
		}
		if resp.StatusCode != http.StatusOK {
			r.log.Error("failed to get openid-configuration",
				abstractlogger.Int("status", resp.StatusCode),
			)
			continue
		}
		defer resp.Body.Close()
		data, err := io.ReadAll(resp.Body)
		if err != nil {
			r.log.Error("failed to read openid-configuration",
				abstractlogger.Error(err),
			)
			continue
		}
		var config OpenIDConnectConfiguration
		err = json.Unmarshal(data, &config)
		if err != nil {
			r.log.Error("failed to decode openid-configuration",
				abstractlogger.Error(err),
			)
			continue
		}
		if config.EndSessionEndpoint == "" {
			r.log.Error("failed to get openid-configuration",
				abstractlogger.String("end_session_endpoint", config.EndSessionEndpoint),
			)
			continue
		}
		issuerLogoutURLs[issuer] = config.EndSessionEndpoint
	}

	return issuerLogoutURLs
}

type OpenIDConnectConfiguration struct {
	Issuer                string `json:"issuer"`
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	TokenEndpoint         string `json:"token_endpoint"`
	UserinfoEndpoint      string `json:"userinfo_endpoint"`
	JwksUri               string `json:"jwks_uri"`
	EndSessionEndpoint    string `json:"end_session_endpoint"`
}

func (r *Builder) configureCookieProvider(router *mux.Router, provider *wgpb.AuthProvider, cookie *securecookie.SecureCookie, pathPrefix string) {

	router.Use(authentication.RedirectAlreadyAuthenticatedUsers(
		loadvariable.Strings(r.api.AuthenticationConfig.CookieBased.AuthorizedRedirectUris),
		loadvariable.Strings(r.api.AuthenticationConfig.CookieBased.AuthorizedRedirectUriRegexes),
	))

	authorizeRouter := router.PathPrefix("/authorize").Subrouter()
	authorizeRouter.Use(authentication.ValidateRedirectURIQueryParameter(
		loadvariable.Strings(r.api.AuthenticationConfig.CookieBased.AuthorizedRedirectUris),
		loadvariable.Strings(r.api.AuthenticationConfig.CookieBased.AuthorizedRedirectUriRegexes),
	))

	callbackRouter := router.PathPrefix("/callback").Subrouter()

	switch provider.Kind {
	case wgpb.AuthProviderKind_AuthProviderGithub:
		if provider.GithubConfig == nil {
			return
		}
		if loadvariable.String(provider.GithubConfig.ClientId) == "demo" {
			provider.GithubConfig.ClientId = &wgpb.ConfigurationVariable{
				Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
				StaticVariableContent: r.githubAuthDemoClientID,
			}
			provider.GithubConfig.ClientSecret = &wgpb.ConfigurationVariable{
				Kind:                  wgpb.ConfigurationVariableKind_STATIC_CONFIGURATION_VARIABLE,
				StaticVariableContent: r.githubAuthDemoClientSecret,
			}
		}
		github := authentication.NewGithubCookieHandler(r.log)
		github.Register(authorizeRouter, callbackRouter, authentication.GithubConfig{
			ClientID:           loadvariable.String(provider.GithubConfig.ClientId),
			ClientSecret:       loadvariable.String(provider.GithubConfig.ClientSecret),
			ProviderID:         provider.Id,
			PathPrefix:         pathPrefix,
			InsecureCookies:    r.insecureCookies,
			ForceRedirectHttps: r.forceHttpsRedirects,
			Cookie:             cookie,
		}, authentication.Hooks{
			Client:                     r.middlewareClient,
			MutatingPostAuthentication: r.api.AuthenticationConfig.Hooks.MutatingPostAuthentication,
			PostAuthentication:         r.api.AuthenticationConfig.Hooks.PostAuthentication,
			Log:                        r.log,
		})
		r.log.Debug("api.configureCookieProvider",
			abstractlogger.String("provider", "github"),
			abstractlogger.String("providerId", provider.Id),
			abstractlogger.String("pathPrefix", pathPrefix),
			abstractlogger.String("clientID", loadvariable.String(provider.GithubConfig.ClientId)),
		)
	case wgpb.AuthProviderKind_AuthProviderOIDC:
		if provider.OidcConfig == nil {
			return
		}

		queryParameters := make([]authentication.QueryParameter, 0, len(provider.OidcConfig.QueryParameters))
		for _, p := range provider.OidcConfig.QueryParameters {
			queryParameters = append(queryParameters, authentication.QueryParameter{
				Name:  loadvariable.String(p.Name),
				Value: loadvariable.String(p.Value),
			})
		}

		openID := authentication.NewOpenIDConnectCookieHandler(r.log)
		openID.Register(authorizeRouter, callbackRouter, authentication.OpenIDConnectConfig{
			Issuer:             loadvariable.String(provider.OidcConfig.Issuer),
			ClientID:           loadvariable.String(provider.OidcConfig.ClientId),
			ClientSecret:       loadvariable.String(provider.OidcConfig.ClientSecret),
			QueryParameters:    queryParameters,
			ProviderID:         provider.Id,
			PathPrefix:         pathPrefix,
			InsecureCookies:    r.insecureCookies,
			ForceRedirectHttps: r.forceHttpsRedirects,
			Cookie:             cookie,
		}, authentication.Hooks{
			Client:                     r.middlewareClient,
			MutatingPostAuthentication: r.api.AuthenticationConfig.Hooks.MutatingPostAuthentication,
			PostAuthentication:         r.api.AuthenticationConfig.Hooks.PostAuthentication,
			Log:                        r.log,
		})
		r.log.Debug("api.configureCookieProvider",
			abstractlogger.String("provider", "oidc"),
			abstractlogger.String("providerId", provider.Id),
			abstractlogger.String("pathPrefix", pathPrefix),
			abstractlogger.String("issuer", loadvariable.String(provider.OidcConfig.Issuer)),
			abstractlogger.String("clientID", loadvariable.String(provider.OidcConfig.ClientId)),
		)
	}
}

type EndpointUnavailableHandler struct {
	OperationName string
}

func (m *EndpointUnavailableHandler) ServeHTTP(w http.ResponseWriter, _ *http.Request) {
	http.Error(w, fmt.Sprintf("Endpoint not available for Operation: %s, please check the logs.", m.OperationName), http.StatusServiceUnavailable)
}

func updateContextHeaders(ctx *resolve.Context, headers map[string]string) {
	if len(headers) == 0 {
		return
	}
	httpHeader := http.Header{}
	for name := range headers {
		httpHeader.Set(name, headers[name])
	}
	ctx.Request.Header = httpHeader
	clientRequest := ctx.Context.Value(pool.ClientRequestKey)
	if clientRequest == nil {
		return
	}
	if cr, ok := clientRequest.(*http.Request); ok {
		cr.Header = httpHeader
	}
}

type OperationMetaData struct {
	OperationName string
	OperationType wgpb.OperationType
}

func (o *OperationMetaData) GetOperationTypeString() string {
	switch o.OperationType {
	case wgpb.OperationType_MUTATION:
		return "mutation"
	case wgpb.OperationType_QUERY:
		return "query"
	case wgpb.OperationType_SUBSCRIPTION:
		return "subscription"
	default:
		return "unknown"
	}
}

func setOperationMetaData(r *http.Request, operation *wgpb.Operation) *http.Request {
	metaData := &OperationMetaData{
		OperationName: operation.Name,
		OperationType: operation.OperationType,
	}
	return r.WithContext(context.WithValue(r.Context(), "operationMetaData", metaData))
}

func getOperationMetaData(r *http.Request) *OperationMetaData {
	maybeMetaData := r.Context().Value("operationMetaData")
	if maybeMetaData == nil {
		return nil
	}
	return maybeMetaData.(*OperationMetaData)
}

func hookBaseData(r *http.Request, buf []byte, variables []byte, response []byte) []byte {
	buf = buf[:0]
	buf = append(buf, []byte(`{"__wg":{}}`)...)
	if user := authentication.UserFromContext(r.Context()); user != nil {
		if userJson, err := json.Marshal(user); err == nil {
			buf, _ = jsonparser.Set(buf, userJson, "__wg", "user")
		}
	}
	if len(variables) > 2 {
		buf, _ = jsonparser.Set(buf, variables, "input")
	}
	if len(response) != 0 {
		buf, _ = jsonparser.Set(buf, response, "response")
	}
	return buf
}

func setSubscriptionHeaders(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	// allow unbuffered responses, it's used when it's necessary just to pass response through
	// setting this to “yes” will allow the response to be cached
	w.Header().Set("X-Accel-Buffering", "no")
}

func getFlushWriter(ctx *resolve.Context, r *http.Request, w http.ResponseWriter) (*httpFlushWriter, bool) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		return nil, false
	}

	subscribeOnce := r.URL.Query().Get("wg_subscribe_once") == "true"
	sse := r.URL.Query().Get("wg_sse") == "true"

	if !subscribeOnce {
		setSubscriptionHeaders(w)
	}

	flusher.Flush()

	flushWriter := &httpFlushWriter{
		writer:  w,
		flusher: flusher,
		sse:     sse,
	}

	if subscribeOnce {
		flushWriter.subscribeOnce = true
		var (
			closeFunc func()
		)
		ctx.Context, closeFunc = context.WithCancel(ctx.Context)
		flushWriter.close = closeFunc
	}

	return flushWriter, true
}
