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
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/buger/jsonparser"
	"github.com/cespare/xxhash"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"github.com/hashicorp/go-multierror"
	"github.com/hashicorp/go-uuid"
	"github.com/rs/cors"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
	"go.uber.org/zap"
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
	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/engineconfigloader"
	"github.com/wundergraph/wundergraph/pkg/graphiql"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/inputvariables"
	"github.com/wundergraph/wundergraph/pkg/interpolate"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/postresolvetransform"
	"github.com/wundergraph/wundergraph/pkg/s3uploadclient"
	"github.com/wundergraph/wundergraph/pkg/webhookhandler"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	WG_PREFIX       = "wg_"
	WG_LIVE         = WG_PREFIX + "live"
	WG_VARIABLES    = WG_PREFIX + "variables"
	WG_CACHE_HEADER = "X-Wg-Cache"
)

type Builder struct {
	router   *mux.Router
	loader   *engineconfigloader.EngineConfigLoader
	api      *Api
	resolver *resolve.Resolver
	pool     *pool.Pool

	middlewareClient *hooks.Client
	hooksServerURL   string

	definition *ast.Document

	log *zap.Logger

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
	log *zap.Logger,
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

func (r *Builder) BuildAndMountApiHandler(ctx context.Context, router *mux.Router, api *Api) (streamClosers []chan struct{}, err error) {

	if api.CacheConfig != nil {
		err = r.configureCache(api)
		if err != nil {
			return streamClosers, err
		}
	}

	r.router = r.createSubRouter(router)

	for _, webhook := range api.Webhooks {
		err = r.registerWebhook(webhook)
		if err != nil {
			r.log.Error("register webhook", zap.Error(err))
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
		zap.Int("numOfOperations", len(api.Operations)),
	)

	// Redirect from old-style URL, for temporary backwards compatibility
	r.router.MatcherFunc(func(r *http.Request, rm *mux.RouteMatch) bool {
		components := strings.Split(r.URL.Path, "/")
		return len(components) > 2 && components[2] == "main"
	}).HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		components := strings.Split(req.URL.Path, "/")
		prefix := strings.Join(components[:3], "/")
		const format = "URLs with the %q prefix are deprecated and will be removed in a future release, " +
			"see https://github.com/wundergraph/wundergraph/blob/main/docs/migrations/sdk-0.122.0-0.123.0.md"
		r.log.Warn(fmt.Sprintf(format, prefix), zap.String("URL", req.URL.Path))
		req.URL.Path = "/" + strings.Join(components[3:], "/")
		r.router.ServeHTTP(w, req)
	})

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

	if r.enableDebugMode {
		r.router.Use(logRequestMiddleware(os.Stderr))
	}

	r.router.Use(func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
			requestID := request.Header.Get(logging.RequestIDHeader)
			if requestID == "" {
				id, _ := uuid.GenerateUUID()
				requestID = id
			}

			request = request.WithContext(context.WithValue(request.Context(), logging.RequestIDKey{}, requestID))
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
			zap.Strings("allowedOrigins", loadvariable.Strings(api.CorsConfiguration.AllowedOrigins)),
		)
	}

	if err := r.registerAuth(r.insecureCookies); err != nil {
		if !r.devMode {
			// If authentication fails in production, consider this a fatal error
			return nil, err
		}
		r.log.Error("configuring auth", zap.Error(err))
	}

	for _, s3Provider := range api.S3UploadConfiguration {
		profiles := make(map[string]*s3uploadclient.UploadProfile, len(s3Provider.UploadProfiles))
		for name, profile := range s3Provider.UploadProfiles {
			profiles[name] = &s3uploadclient.UploadProfile{
				MaxFileSizeBytes:      int(profile.MaxAllowedUploadSizeBytes),
				MaxAllowedFiles:       int(profile.MaxAllowedFiles),
				AllowedMimeTypes:      append([]string(nil), profile.AllowedMimeTypes...),
				AllowedFileExtensions: append([]string(nil), profile.AllowedFileExtensions...),
				MetadataJSONSchema:    profile.MetadataJSONSchema,
				UsePreUploadHook:      profile.Hooks.PreUpload,
				UsePostUploadHook:     profile.Hooks.PostUpload,
			}
		}
		s3, err := s3uploadclient.NewS3UploadClient(loadvariable.String(s3Provider.Endpoint),
			s3uploadclient.Options{
				Logger:          r.log,
				BucketName:      loadvariable.String(s3Provider.BucketName),
				BucketLocation:  loadvariable.String(s3Provider.BucketLocation),
				AccessKeyID:     loadvariable.String(s3Provider.AccessKeyID),
				SecretAccessKey: loadvariable.String(s3Provider.SecretAccessKey),
				UseSSL:          s3Provider.UseSSL,
				Profiles:        profiles,
				HooksClient:     r.middlewareClient,
				Name:            s3Provider.Name,
			},
		)
		if err != nil {
			r.log.Error("registerS3UploadClient", zap.Error(err))
		} else {
			s3Path := fmt.Sprintf("/s3/%s/upload", s3Provider.Name)
			r.router.Handle(s3Path, authentication.RequiresAuthentication(http.HandlerFunc(s3.UploadFile)))
			r.log.Debug("register S3 provider", zap.String("provider", s3Provider.Name))
			r.log.Debug("register S3 endpoint", zap.String("path", s3Path))
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
			r.log.Error("registerOperation", zap.Error(err))
		}
	}

	for _, operationName := range api.InvalidOperationNames {
		r.registerInvalidOperation(operationName)
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
			zap.String("method", http.MethodPost),
			zap.String("path", apiPath),
		)

		graphqlPlaygroundHandler := &GraphQLPlaygroundHandler{
			log:     r.log,
			html:    graphiql.GetGraphiqlPlaygroundHTML(),
			nodeUrl: api.Options.PublicNodeUrl,
		}
		r.router.Methods(http.MethodGet, http.MethodOptions).Path(apiPath).Handler(graphqlPlaygroundHandler)
		r.log.Debug("registered GraphQLPlaygroundHandler",
			zap.String("method", http.MethodGet),
			zap.String("path", apiPath),
		)

	}

	return streamClosers, err
}

func shouldLogRequestBody(request *http.Request) bool {
	// If the request looks like a file upload, avoid printing the whole
	// encoded file as a debug message.
	return !strings.HasPrefix(request.Header.Get("Content-Type"), "multipart/form-data")
}

// returns a middleware that logs all requests to the given io.Writer
func logRequestMiddleware(logger io.Writer) mux.MiddlewareFunc {
	return func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
			logBody := shouldLogRequestBody(request)
			suffix := ""
			if !logBody {
				suffix = "<body omitted>"
			}
			requestDump, err := httputil.DumpRequest(request, logBody)
			if err == nil {
				fmt.Fprintf(logger, "\n\n--- ClientRequest start ---\n\n%s%s\n\n\n\n--- ClientRequest end ---\n\n",
					string(requestDump), suffix,
				)
			}
			handler.ServeHTTP(w, request)
		})
	}
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

func (r *Builder) createSubRouter(router *mux.Router) *mux.Router {
	route := router.NewRoute()

	r.log.Debug("create sub router")
	return route.Subrouter()
}

func (r *Builder) registerWebhook(config *wgpb.WebhookConfiguration) error {
	handler, err := webhookhandler.New(config, r.hooksServerURL, r.log)
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

func operationApiPath(name string) string {
	return fmt.Sprintf("/operations/%s", name)
}

func (r *Builder) registerInvalidOperation(name string) {
	apiPath := operationApiPath(name)
	route := r.router.Methods(http.MethodGet, http.MethodPost, http.MethodOptions).Path(apiPath)
	route.Handler(&EndpointUnavailableHandler{
		OperationName: name,
		Logger:        r.log,
	})
	r.log.Warn("EndpointUnavailableHandler",
		zap.String("Operation", name),
		zap.String("Endpoint", apiPath),
		zap.String("Help", "This operation is invalid. Please, check the logs"),
	)
}

func (r *Builder) registerOperation(operation *wgpb.Operation) error {

	if operation.Internal {
		return nil
	}

	apiPath := operationApiPath(operation.Path)

	if operation.Engine == wgpb.OperationExecutionEngine_ENGINE_NODEJS {
		return r.registerNodejsOperation(operation, apiPath)
	}

	var (
		operationIsConfigured bool
	)

	defer func() {
		if !operationIsConfigured {
			r.registerInvalidOperation(operation.Name)
		}
	}()

	shared := r.pool.GetShared(context.Background(), r.planConfig, pool.Config{})

	shared.Doc.Input.ResetInputString(operation.Content)
	shared.Parser.Parse(shared.Doc, shared.Report)

	if shared.Report.HasErrors() {
		return fmt.Errorf(ErrMsgOperationParseFailed, shared.Report)
	}

	shared.Normalizer.NormalizeNamedOperation(shared.Doc, r.definition, []byte(operation.Name), shared.Report)
	if shared.Report.HasErrors() {
		return fmt.Errorf(ErrMsgOperationNormalizationFailed, shared.Report)
	}

	state := shared.Validation.Validate(shared.Doc, r.definition, shared.Report)
	if state != astvalidation.Valid {
		return fmt.Errorf(ErrMsgOperationValidationFailed, shared.Report)
	}

	preparedPlan := shared.Planner.Plan(shared.Doc, r.definition, operation.Name, shared.Report)
	shared.Postprocess.Process(preparedPlan)

	variablesValidator, err := inputvariables.NewValidator(cleanupJsonSchema(operation.VariablesSchema), false)
	if err != nil {
		return err
	}

	queryParamsAllowList := generateQueryArgumentsAllowList(operation.VariablesSchema)

	stringInterpolator, err := interpolate.NewStringInterpolator(cleanupJsonSchema(operation.VariablesSchema))
	if err != nil {
		return err
	}

	jsonStringInterpolator, err := interpolate.NewStringInterpolatorJSONOnly(cleanupJsonSchema(operation.InterpolationVariablesSchema))
	if err != nil {
		return err
	}

	postResolveTransformer := postresolvetransform.NewTransformer(operation.PostResolveTransformations)

	switch operation.OperationType {
	case wgpb.OperationType_QUERY:
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
			zap.String("method", http.MethodGet),
			zap.String("path", apiPath),
			zap.Bool("mock", operation.HooksConfiguration.MockResolve.Enable),
			zap.Bool("cacheEnabled", handler.cacheConfig.enable),
			zap.Int("cacheMaxAge", int(handler.cacheConfig.maxAge)),
			zap.Int("cacheStaleWhileRevalidate", int(handler.cacheConfig.staleWhileRevalidate)),
			zap.Bool("cachePublic", handler.cacheConfig.public),
			zap.Bool("authRequired", operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired),
		)
	case wgpb.OperationType_MUTATION:
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
			zap.String("method", http.MethodPost),
			zap.String("path", apiPath),
			zap.Bool("mock", operation.HooksConfiguration.MockResolve.Enable),
			zap.Bool("authRequired", operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired),
		)
	case wgpb.OperationType_SUBSCRIPTION:
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
			hooksClient:            r.middlewareClient,
			hooksConfig:            buildHooksConfig(operation),
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
			zap.String("method", http.MethodGet),
			zap.String("path", apiPath),
			zap.Bool("mock", operation.HooksConfiguration.MockResolve.Enable),
			zap.Bool("authRequired", operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired),
		)
	default:
		r.log.Debug("operation type unknown",
			zap.String("name", operation.Name),
			zap.String("content", operation.Content),
		)
	}

	return nil
}

func generateQueryArgumentsAllowList(schema string) []string {
	var allowList []string
	schema = cleanupJsonSchema(schema)
	_ = jsonparser.ObjectEach([]byte(schema), func(key []byte, value []byte, dataType jsonparser.ValueType, offset int) error {
		allowList = append(allowList, string(key))
		return nil
	}, "properties")
	return allowList
}

func cleanupJsonSchema(schema string) string {
	schema = strings.Replace(schema, "/definitions/", "/$defs/", -1)
	schema = strings.Replace(schema, "\"definitions\"", "\"$defs\"", -1)
	return schema
}

func (r *Builder) configureCache(api *Api) (err error) {
	config := api.CacheConfig
	switch config.Kind {
	case wgpb.ApiCacheKind_IN_MEMORY_CACHE:
		r.log.Debug("configureCache",
			zap.String("primaryHost", api.PrimaryHost),
			zap.String("deploymentID", api.DeploymentId),
			zap.String("cacheKind", config.Kind.String()),
			zap.Int("cacheSize", int(config.InMemoryConfig.MaxSize)),
		)
		r.cache, err = apicache.NewInMemory(config.InMemoryConfig.MaxSize)
		return
	case wgpb.ApiCacheKind_REDIS_CACHE:

		redisAddr := os.Getenv(config.RedisConfig.RedisUrlEnvVar)

		r.log.Debug("configureCache",
			zap.String("primaryHost", api.PrimaryHost),
			zap.String("deploymentID", api.DeploymentId),
			zap.String("cacheKind", config.Kind.String()),
			zap.String("envVar", config.RedisConfig.RedisUrlEnvVar),
			zap.String("redisAddr", redisAddr),
		)

		r.cache, err = apicache.NewRedis(redisAddr, r.log)
		return
	default:
		r.log.Debug("configureCache",
			zap.String("primaryHost", api.PrimaryHost),
			zap.String("deploymentID", api.DeploymentId),
			zap.String("cacheKind", config.Kind.String()),
		)
		r.cache = &apicache.NoOpCache{}
		return
	}
}

func (r *Builder) Close() error {
	if closer, ok := r.cache.(io.Closer); ok {
		if err := closer.Close(); err != nil {
			return err
		}
	}
	return nil
}

type GraphQLPlaygroundHandler struct {
	log     *zap.Logger
	html    string
	nodeUrl string
}

func (h *GraphQLPlaygroundHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	tpl := strings.Replace(h.html, "{{apiURL}}", h.nodeUrl, 1)
	resp := []byte(tpl)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Length", strconv.Itoa(len(resp)))
	_, _ = w.Write(resp)
}

type GraphQLHandler struct {
	planConfig plan.Configuration
	definition *ast.Document
	resolver   *resolve.Resolver
	log        *zap.Logger
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
	requestLogger := h.log.With(logging.WithRequestIDFromContext(r.Context()))

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
		h.logInternalErrors(shared.Report, requestLogger)
		h.writeRequestErrors(shared.Report, w, requestLogger)

		w.WriteHeader(http.StatusBadRequest)
		return
	}

	_, _ = shared.Hash.Write(requestOperationName)

	err = shared.Printer.Print(shared.Doc, h.definition, shared.Hash)
	if err != nil {
		requestLogger.Error("shared printer print failed", zap.Error(err))
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	if shared.Report.HasErrors() {
		h.logInternalErrors(shared.Report, requestLogger)
		h.writeRequestErrors(shared.Report, w, requestLogger)

		w.WriteHeader(http.StatusBadRequest)
		return
	}

	operationHash := shared.Hash.Sum64()

	h.preparedMux.RLock()
	prepared, exists := h.prepared[operationHash]
	h.preparedMux.RUnlock()
	if !exists {
		prepared, err = h.preparePlan(operationHash, requestOperationName, shared)
		if err != nil {
			if shared.Report.HasErrors() {
				h.logInternalErrors(shared.Report, requestLogger)
				h.writeRequestErrors(shared.Report, w, requestLogger)
			} else {
				requestLogger.Error("prepare plan failed", zap.Error(err))
				w.WriteHeader(http.StatusBadRequest)
			}

			return
		}
	}

	if len(prepared.variables) != 0 {
		// we have to merge query variables into extracted variables to been able to override default values
		shared.Ctx.Variables = MergeJsonRightIntoLeft(prepared.variables, shared.Ctx.Variables)
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

			requestErrors := graphql.RequestErrors{
				{
					Message: "could not resolve response",
				},
			}

			if _, err := requestErrors.WriteResponse(w); err != nil {
				requestLogger.Error("could not write response", zap.Error(err))
			}

			requestLogger.Error("ResolveGraphQLResponse", zap.Error(err))
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		_, err = executionBuf.WriteTo(w)
		if err != nil {
			requestLogger.Error("respond to client", zap.Error(err))
			return
		}
	case *plan.SubscriptionResponsePlan:
		var (
			flushWriter *httpFlushWriter
			ok          bool
		)
		shared.Ctx.Context, flushWriter, ok = getFlushWriter(shared.Ctx.Context, shared.Ctx.Variables, r, w)
		if !ok {
			requestLogger.Error("connection not flushable")
			http.Error(w, "Connection not flushable", http.StatusBadRequest)
			return
		}

		err := h.resolver.ResolveGraphQLSubscription(shared.Ctx, p.Response, flushWriter)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				return
			}

			requestErrors := graphql.RequestErrors{
				{
					Message: "could not resolve response",
				},
			}

			if _, err := requestErrors.WriteResponse(w); err != nil {
				requestLogger.Error("could not write response", zap.Error(err))
			}

			requestLogger.Error("ResolveGraphQLSubscription", zap.Error(err))
			w.WriteHeader(http.StatusBadRequest)
			return
		}
	case *plan.StreamingResponsePlan:
		http.Error(w, "not implemented", http.StatusNotFound)
	}
}

func (h *GraphQLHandler) logInternalErrors(report *operationreport.Report, requestLogger *zap.Logger) {
	var internalErr error
	for _, err := range report.InternalErrors {
		internalErr = multierror.Append(internalErr, err)
	}

	if internalErr != nil {
		requestLogger.Error("internal error", zap.Error(internalErr))
	}
}

func (h *GraphQLHandler) writeRequestErrors(report *operationreport.Report, w http.ResponseWriter, requestLogger *zap.Logger) {
	requestErrors := graphql.RequestErrorsFromOperationReport(*report)
	if requestErrors != nil {
		if _, err := requestErrors.WriteResponse(w); err != nil {
			requestLogger.Error("error writing response", zap.Error(err))
		}
	}
}

func (h *GraphQLHandler) preparePlan(operationHash uint64, requestOperationName []byte, shared *pool.Shared) (planWithExtractedVariables, error) {
	preparedPlan, err, _ := h.sf.Do(strconv.Itoa(int(operationHash)), func() (interface{}, error) {
		if len(requestOperationName) == 0 {
			shared.Normalizer.NormalizeOperation(shared.Doc, h.definition, shared.Report)
		} else {
			shared.Normalizer.NormalizeNamedOperation(shared.Doc, h.definition, requestOperationName, shared.Report)
		}
		if shared.Report.HasErrors() {
			return nil, fmt.Errorf(ErrMsgOperationNormalizationFailed, shared.Report)
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
	log                    *zap.Logger
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
	requestLogger := h.log.With(logging.WithRequestIDFromContext(r.Context()))
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

	if !validateInputVariables(ctx, requestLogger, ctx.Variables, h.variablesValidator, w) {
		return
	}

	compactBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(compactBuf)
	err := json.Compact(compactBuf, ctx.Variables)
	if err != nil {
		requestLogger.Error("Could not compact variables in query handler", zap.Bool("isLive", isLive), zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	ctx.Variables = compactBuf.Bytes()

	ctx.Variables = h.jsonStringInterpolator.Interpolate(ctx.Variables)

	if len(h.extractedVariables) != 0 {
		ctx.Variables = MergeJsonRightIntoLeft(h.extractedVariables, ctx.Variables)
	}

	ctx.Variables = postProcessVariables(h.operation, r, ctx.Variables)

	flusher, flusherOk := w.(http.Flusher)
	if isLive {
		if !flusherOk {
			requestLogger.Error("Could not flush in query handler", zap.Bool("isLive", isLive))
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
		if done := handleOperationErr(requestLogger, err, w, "mockResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "mockResolve hook out is nil", h.operation); done {
			return
		}
		_, _ = w.Write(out.Response)
		return
	}

	if isLive {
		h.handleLiveQuery(r, w, ctx, buf, flusher, requestLogger)
		return
	}

	if h.cacheConfig.enable {
		cacheKey = string(h.configHash) + r.RequestURI
		item, hit := h.cache.Get(ctx.Context, cacheKey)
		if hit {

			w.Header().Set(WG_CACHE_HEADER, "HIT")

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
		w.Header().Set(WG_CACHE_HEADER, "MISS")
	}

	if h.hooksConfig.preResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PreResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "preResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "preResolve hook out is nil", h.operation); done {
			return
		}
	}

	if h.hooksConfig.mutatingPreResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPreResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "mutatingPreResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "mutatingPreResolve hook out is nil", h.operation); done {
			return
		}
		ctx.Variables = out.Input
	}

	if h.hooksConfig.customResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.CustomResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "customResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "customResolve hook out is nil", h.operation); done {
			return
		}
		// the customResolve hook can indicate to "skip" by responding with "null"
		// so, we only write the response if it's not null
		if !bytes.Equal(out.Response, literal.NULL) {
			_, _ = w.Write(out.Response)
			return
		}
	}

	err = h.resolver.ResolveGraphQLResponse(ctx, h.preparedPlan.Response, nil, buf)
	if done := handleOperationErr(requestLogger, err, w, "ResolveGraphQLResponse failed", h.operation); done {
		return
	}
	transformed, err := h.postResolveTransformer.Transform(buf.Bytes())
	if done := handleOperationErr(requestLogger, err, w, "postResolveTransformer failed", h.operation); done {
		return
	}
	if h.hooksConfig.postResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		_, err = h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PostResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "postResolve hook failed", h.operation); done {
			return
		}
	}
	if h.hooksConfig.mutatingPostResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPostResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "mutatingPostResolve hook failed", h.operation); done {
			return
		}
		if out == nil {
			requestLogger.Error("MutatingPostResolve query hook response is empty")
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
	if done := handleOperationErr(requestLogger, err, w, "writing response failed", h.operation); done {
		return
	}
}

func (h *QueryHandler) handleLiveQueryEvent(ctx *resolve.Context, r *http.Request, requestBuf *bytes.Buffer, hookBuf *bytes.Buffer, requestLogger *zap.Logger) ([]byte, error) {
	if h.hooksConfig.preResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PreResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("handleLiveQueryEvent preResolve hook failed: %w", err)
		}
		if out != nil {
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			return nil, errors.New("handleLiveQueryEvent preResolve hook response is nil")
		}
	}

	if h.hooksConfig.mutatingPreResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPreResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("handleLiveQueryEvent mutatingPreResolve hook failed: %w", err)
		}
		if out != nil {
			ctx.Variables = out.Input
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			requestLogger.Error("handleLiveQueryEvent mutatingPreResolve hook response is nil")
		}
	}

	if h.hooksConfig.customResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.CustomResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("handleLiveQueryEvent customResolve hook failed: %w", err)
		}
		if out != nil {
			updateContextHeaders(ctx, out.SetClientRequestHeaders)
		} else {
			return nil, errors.New("handleLiveQueryEvent customResolve hook response is nil")
		}
		// when the hook is skipped
		if !bytes.Equal(out.Response, literal.NULL) {
			requestLogger.Debug("CustomResolve is skipped and empty response is written")
			return out.Response, nil
		}
	}

	requestBuf.Reset()
	err := h.resolver.ResolveGraphQLResponse(ctx, h.preparedPlan.Response, nil, requestBuf)
	if err != nil {
		return nil, fmt.Errorf("handleLiveQueryEvent ResolveGraphQLResponse failed: %w", err)
	}

	transformed, err := h.postResolveTransformer.Transform(requestBuf.Bytes())
	if err != nil {
		return nil, fmt.Errorf("handleLiveQueryEvent postResolveTransformer.Transform failed: %w", err)
	}
	if h.hooksConfig.postResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		_, err = h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PostResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("handleLiveQueryEvent postResolve hook failed: %w", err)
		}
	}

	if h.hooksConfig.mutatingPostResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPostResolve, hookData)
		if err != nil {
			return nil, fmt.Errorf("handleLiveQueryEvent mutatingPostResolve hook failed: %w", err)
		}
		if out == nil {
			return nil, errors.New("handleLiveQueryEvent mutatingPostResolve hook response is nil")
		}
		transformed = out.Response
	}

	return transformed, nil
}

func (h *QueryHandler) handleLiveQuery(r *http.Request, w http.ResponseWriter, ctx *resolve.Context, requestBuf *bytes.Buffer, flusher http.Flusher, requestLogger *zap.Logger) {
	subscribeOnce := r.URL.Query().Get("wg_subscribe_once") == "true"
	sse := r.URL.Query().Get("wg_sse") == "true"

	done := ctx.Context.Done()
	hash := xxhash.New()

	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	var lastHash uint64
	for {
		var hookError bool
		response, err := h.handleLiveQueryEvent(ctx, r, requestBuf, hookBuf, requestLogger)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				// context was canceled (e.g. client disconnected)
				// we've already flushed a header, so we simply return
				return
			}
			hookError = true
			requestLogger.Error("HandleLiveQueryEvent failed",
				zap.Error(err),
				zap.String("operation", h.operation.Name),
			)

			graphqlError := graphql.Response{
				Errors: graphql.RequestErrors{
					graphql.RequestError{
						Message: err.Error(),
					},
				},
			}
			graphqlErrorPayload, marshalErr := graphqlError.Marshal()
			if marshalErr != nil {
				requestLogger.Error("HandleLiveQueryEvent could not marshal graphql error", zap.Error(marshalErr))
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
			_, _ = reader.WriteTo(w)
			if subscribeOnce {
				flusher.Flush()
				return
			}
			_, _ = w.Write(literal.LINETERMINATOR)
			_, err = w.Write(literal.LINETERMINATOR)
			if err != nil {
				return
			}
			flusher.Flush()
		}

		// After hook error we return the graphql compatible error to the client
		// and abort the stream
		if hookError {
			requestLogger.Error("HandleLiveQueryEvent cancel due to hook error", zap.Error(err))
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
	log                    *zap.Logger
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
	requestLogger := h.log.With(logging.WithRequestIDFromContext(r.Context()))
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
			requestLogger.Error("failed to copy variables buf", zap.Error(err))
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		ctx.Variables = variablesBuf.Bytes()
	}

	if len(ctx.Variables) == 0 {
		ctx.Variables = []byte("{}")
	}
	ctx.Variables = h.stringInterpolator.Interpolate(ctx.Variables)

	if !validateInputVariables(ctx, requestLogger, ctx.Variables, h.variablesValidator, w) {
		return
	}

	compactBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(compactBuf)
	err := json.Compact(compactBuf, ctx.Variables)
	if err != nil {
		requestLogger.Error("failed to compact variables", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	ctx.Variables = compactBuf.Bytes()

	ctx.Variables = h.jsonStringInterpolator.Interpolate(ctx.Variables)

	if len(h.extractedVariables) != 0 {
		ctx.Variables = MergeJsonRightIntoLeft(h.extractedVariables, ctx.Variables)
	}

	ctx.Variables = postProcessVariables(h.operation, r, ctx.Variables)

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	if h.hooksConfig.mockResolve.enable {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MockResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "mockResolve hook failed", h.operation); done {
			return
		}
		_, _ = w.Write(out.Response)
		return
	}

	if h.hooksConfig.preResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PreResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "preResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "preResolve hook out is nil", h.operation); done {
			return
		}
	}

	if h.hooksConfig.mutatingPreResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPreResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "mutatingPreResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "mutatingPreResolve hook out is nil", h.operation); done {
			return
		}
		ctx.Variables = out.Input
	}

	if h.hooksConfig.customResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.CustomResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "customResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "customResolve hook out is nil", h.operation); done {
			return
		}
		// when the hook is skipped
		if !bytes.Equal(out.Response, literal.NULL) {
			requestLogger.Debug("CustomResolve is skipped and empty response is written")
			_, _ = w.Write(out.Response)
			return
		}
	}

	resolveErr := h.resolver.ResolveGraphQLResponse(ctx, h.preparedPlan.Response, nil, buf)
	if done := handleOperationErr(requestLogger, resolveErr, w, "ResolveGraphQLResponse", h.operation); done {
		return
	}

	transformed, err := h.postResolveTransformer.Transform(buf.Bytes())
	if done := handleOperationErr(requestLogger, err, w, "postResolveTransformer", h.operation); done {
		return
	}
	if h.hooksConfig.postResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		_, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PostResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "postResolve hook failed", h.operation); done {
			return
		}
	}

	if h.hooksConfig.mutatingPostResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, transformed)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPostResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "mutatingPostResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "mutatingPostResolve hook out is nil", h.operation); done {
			return
		}
		transformed = out.Response
	}

	reader := bytes.NewReader(transformed)
	_, err = reader.WriteTo(w)
	if done := handleOperationErr(requestLogger, err, w, "writing response failed", h.operation); done {
		return
	}
}

type SubscriptionHandler struct {
	resolver               *resolve.Resolver
	log                    *zap.Logger
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
	hooksClient            *hooks.Client
	hooksConfig            hooksConfig
}

func (h *SubscriptionHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	requestLogger := h.log.With(logging.WithRequestIDFromContext(r.Context()))
	r = setOperationMetaData(r, h.operation)

	if proceed := h.rbacEnforcer.Enforce(r); !proceed {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := pool.GetCtx(r, r, pool.Config{
		RenameTypeNames: h.renameTypeNames,
	})
	defer pool.PutCtx(ctx)

	ctx.Variables = parseQueryVariables(r, h.queryParamsAllowList)
	ctx.Variables = h.stringInterpolator.Interpolate(ctx.Variables)

	if !validateInputVariables(ctx, requestLogger, ctx.Variables, h.variablesValidator, w) {
		return
	}

	compactBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(compactBuf)
	err := json.Compact(compactBuf, ctx.Variables)
	if err != nil {
		requestLogger.Error("Could not compact variables", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	ctx.Variables = compactBuf.Bytes()

	ctx.Variables = h.jsonStringInterpolator.Interpolate(ctx.Variables)

	if len(h.extractedVariables) != 0 {
		ctx.Variables = MergeJsonRightIntoLeft(h.extractedVariables, ctx.Variables)
	}

	ctx.Variables = postProcessVariables(h.operation, r, ctx.Variables)

	var (
		flushWriter *httpFlushWriter
		ok          bool
	)

	ctx.Context, flushWriter, ok = getFlushWriter(ctx.Context, ctx.Variables, r, w)
	if !ok {
		http.Error(w, "Connection not flushable", http.StatusBadRequest)
		return
	}

	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	if h.hooksConfig.preResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.PreResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "preResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "preResolve hook out is nil", h.operation); done {
			return
		}
	}

	if h.hooksConfig.mutatingPreResolve {
		hookData := hookBaseData(r, hookBuf.Bytes(), ctx.Variables, nil)
		out, err := h.hooksClient.DoOperationRequest(ctx.Context, h.operation.Name, hooks.MutatingPreResolve, hookData)
		if done := handleOperationErr(requestLogger, err, w, "mutatingPreResolve hook failed", h.operation); done {
			return
		}
		if done := handleHookOut(ctx, w, requestLogger, out, "mutatingPreResolve hook out is nil", h.operation); done {
			return
		}
		ctx.Variables = out.Input
	}

	if h.hooksConfig.postResolve {
		var callback flushWriterPostResolveCallback = func(ctx context.Context, variables, resp []byte) {
			hookData := hookBaseData(r, hookBuf.Bytes(), variables, resp)
			_, err := h.hooksClient.DoOperationRequest(ctx, h.operation.Name, hooks.PostResolve, hookData)
			_ = handleOperationErr(requestLogger, err, w, "postResolve hook failed", h.operation)
		}

		flushWriter.postResolveCallback = &callback
	}

	if h.hooksConfig.mutatingPostResolve {
		var callback flushWriterMutatingPostResolveCallback = func(ctx context.Context, variables, resp []byte) ([]byte, error) {
			hookData := hookBaseData(r, hookBuf.Bytes(), variables, resp)
			out, err := h.hooksClient.DoOperationRequest(ctx, h.operation.Name, hooks.MutatingPostResolve, hookData)
			if err != nil {
				if errors.Is(err, context.Canceled) {
					// e.g. client closed connection
					return nil, nil
				}

				requestLogger.Error("MutatingPostResolve subscription hook failed", zap.Error(err))
				return nil, err
			}
			if out == nil {
				requestLogger.Error("MutatingPostResolve subscription hook response is empty")
				return nil, errors.New("mutatingPostResolve hook response is empty")
			}
			return out.Response, nil
		}

		flushWriter.mutatingPostResolveCallback = &callback
	}

	err = h.resolver.ResolveGraphQLSubscription(ctx, h.preparedPlan.Response, flushWriter)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			// e.g. client closed connection
			return
		}
		// if the deadline is exceeded (e.g. timeout), we don't have to return an HTTP error
		// we've already flushed a response to the client
		requestLogger.Error("ResolveGraphQLSubscription", zap.Error(err))
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

type flushWriterMutatingPostResolveCallback func(ctx context.Context, variables, resp []byte) ([]byte, error)
type flushWriterPostResolveCallback func(ctx context.Context, variables, resp []byte)

type httpFlushWriter struct {
	writer                      io.Writer
	flusher                     http.Flusher
	postResolveTransformer      *postresolvetransform.Transformer
	subscribeOnce               bool
	sse                         bool
	close                       func()
	buf                         *bytes.Buffer
	mutatingPostResolveCallback *flushWriterMutatingPostResolveCallback
	postResolveCallback         *flushWriterPostResolveCallback
	ctx                         context.Context
	variables                   []byte
}

func (f *httpFlushWriter) Write(p []byte) (n int, err error) {
	if f.postResolveTransformer != nil {
		p, err = f.postResolveTransformer.Transform(p)
		if err != nil {
			return 0, err
		}
	}

	return f.buf.Write(p)
}

func (f *httpFlushWriter) Flush() {
	resp := f.buf.Bytes()
	f.buf.Reset()

	if f.postResolveCallback != nil {
		(*f.postResolveCallback)(f.ctx, f.variables, resp)
	}

	if f.mutatingPostResolveCallback != nil {
		if r, err := (*f.mutatingPostResolveCallback)(f.ctx, f.variables, resp); err == nil {
			resp = r
		}
	}

	if f.sse {
		_, _ = f.writer.Write([]byte("data: "))
		_, _ = f.writer.Write(resp)
	} else {
		_, _ = f.writer.Write(resp)
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

func (r *Builder) registerAuth(insecureCookies bool) error {

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

	if r.api == nil || r.api.HasCookieAuthEnabled() && (hashKey == nil || blockKey == nil || csrfSecret == nil) {
		panic("API is nil or hashkey, blockkey, csrfsecret invalid: This should never have happened, validation didn't detect broken configuration, someone broke the validation code")
	}

	cookie := securecookie.New(hashKey, blockKey)

	if r.api.AuthenticationConfig.JwksBased != nil {
		jwksProviders = r.api.AuthenticationConfig.JwksBased.Providers
	}

	authHooks := authentication.Hooks{
		Log:                        r.log,
		Client:                     r.middlewareClient,
		MutatingPostAuthentication: r.api.AuthenticationConfig.Hooks.MutatingPostAuthentication,
		PostAuthentication:         r.api.AuthenticationConfig.Hooks.PostAuthentication,
		PostLogout:                 r.api.AuthenticationConfig.Hooks.PostLogout,
	}

	loadUserConfig := authentication.LoadUserConfig{
		Log:           r.log,
		Cookie:        cookie,
		JwksProviders: jwksProviders,
		Hooks:         authHooks,
	}

	r.router.Use(authentication.NewLoadUserMw(loadUserConfig))
	r.router.Use(authentication.NewCSRFMw(authentication.CSRFConfig{
		InsecureCookies: insecureCookies,
		Secret:          csrfSecret,
	}))

	userHandler := &authentication.UserHandler{
		HasRevalidateHook: r.api.AuthenticationConfig.Hooks.RevalidateAuthentication,
		MWClient:          r.middlewareClient,
		Log:               r.log,
		InsecureCookies:   insecureCookies,
		Cookie:            cookie,
	}

	r.router.Path("/auth/user").Methods(http.MethodGet, http.MethodOptions).Handler(userHandler)

	// fallback for old token user path
	// @deprecated use /auth/user instead
	r.router.Path("/auth/token/user").Methods(http.MethodGet, http.MethodOptions).Handler(userHandler)

	cookieBasedAuth := r.router.PathPrefix("/auth/cookie").Subrouter()

	// fallback for old cookie user path
	// @deprecated use /auth/user instead
	cookieBasedAuth.Path("/user").Methods(http.MethodGet, http.MethodOptions).Handler(userHandler)

	cookieBasedAuth.Path("/csrf").Methods(http.MethodGet, http.MethodOptions).Handler(&authentication.CSRFTokenHandler{})

	return r.registerCookieAuthHandlers(cookieBasedAuth, cookie, authHooks)
}

func (r *Builder) registerCookieAuthHandlers(router *mux.Router, cookie *securecookie.SecureCookie, authHooks authentication.Hooks) error {

	oidcProviders, err := r.configureOpenIDConnectProviders()
	if err != nil {
		return fmt.Errorf("error configuring OIDC providers: %w", err)
	}

	router.Path("/user/logout").Methods(http.MethodGet, http.MethodOptions).Handler(&authentication.UserLogoutHandler{
		InsecureCookies: r.insecureCookies,
		OpenIDProviders: oidcProviders,
		Hooks:           authHooks,
		Log:             r.log,
	})

	if r.api.AuthenticationConfig == nil || r.api.AuthenticationConfig.CookieBased == nil {
		return nil
	}

	for _, provider := range r.api.AuthenticationConfig.CookieBased.Providers {
		r.configureCookieProvider(router, provider, cookie)
	}

	return nil
}

func (r *Builder) configureOpenIDConnectProviders() (*authentication.OpenIDConnectProviderSet, error) {
	var providers authentication.OpenIDConnectProviderSet

	httpClient := &http.Client{
		Timeout: r.api.Options.DefaultTimeout,
	}

	for _, provider := range r.api.AuthenticationConfig.CookieBased.Providers {
		var flavor authentication.OpenIDConnectFlavor
		switch provider.Kind {
		case wgpb.AuthProviderKind_AuthProviderOIDC:
			flavor = authentication.OpenIDConnectFlavorDefault
		case wgpb.AuthProviderKind_AuthProviderAuth0:
			flavor = authentication.OpenIDConnectFlavorAuth0
		default:
			continue
		}
		if provider.OidcConfig == nil {
			continue
		}
		issuer := loadvariable.String(provider.OidcConfig.Issuer)
		clientID := loadvariable.String(provider.OidcConfig.ClientId)
		clientSecret := loadvariable.String(provider.OidcConfig.ClientId)

		oidc, err := authentication.NewOpenIDConnectProvider(issuer, clientID, clientSecret, &authentication.OpenIDConnectProviderOptions{
			Flavor:     flavor,
			HTTPClient: httpClient,
			Logger:     r.log,
		})
		if err != nil {
			return nil, fmt.Errorf("error in %s OIDC provider: %w", provider.Id, err)
		}
		if err := providers.Add(provider.Id, oidc); err != nil {
			return nil, fmt.Errorf("could not register OIDC provider %s: %w", provider.Id, err)
		}
	}

	return &providers, nil
}

func (r *Builder) configureCookieProvider(router *mux.Router, provider *wgpb.AuthProvider, cookie *securecookie.SecureCookie) {

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
			zap.String("provider", "github"),
			zap.String("providerId", provider.Id),
			zap.String("clientID", loadvariable.String(provider.GithubConfig.ClientId)),
		)
	case wgpb.AuthProviderKind_AuthProviderOIDC:
		fallthrough
	case wgpb.AuthProviderKind_AuthProviderAuth0:
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
			zap.String("provider", "oidc"),
			zap.String("providerId", provider.Id),
			zap.String("issuer", loadvariable.String(provider.OidcConfig.Issuer)),
			zap.String("clientID", loadvariable.String(provider.OidcConfig.ClientId)),
		)
	default:
		panic("unreachable")
	}
}

func (r *Builder) registerNodejsOperation(operation *wgpb.Operation, apiPath string) error {
	var (
		route *mux.Route
	)

	if operation.OperationType == wgpb.OperationType_MUTATION {
		route = r.router.Methods(http.MethodPost, http.MethodOptions).Path(apiPath)
	} else {
		// query and subscription
		route = r.router.Methods(http.MethodGet, http.MethodOptions).Path(apiPath)
	}

	variablesValidator, err := inputvariables.NewValidator(cleanupJsonSchema(operation.VariablesSchema), false)
	if err != nil {
		return err
	}

	stringInterpolator, err := interpolate.NewStringInterpolator(cleanupJsonSchema(operation.VariablesSchema))
	if err != nil {
		return err
	}

	handler := &FunctionsHandler{
		operation:            operation,
		log:                  r.log,
		variablesValidator:   variablesValidator,
		rbacEnforcer:         authentication.NewRBACEnforcer(operation),
		hooksClient:          r.middlewareClient,
		queryParamsAllowList: generateQueryArgumentsAllowList(operation.VariablesSchema),
		stringInterpolator:   stringInterpolator,
		liveQuery: liveQueryConfig{
			enabled:                operation.LiveQueryConfig.Enable,
			pollingIntervalSeconds: operation.LiveQueryConfig.PollingIntervalSeconds,
		},
	}

	if operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired {
		route.Handler(authentication.RequiresAuthentication(handler))
	} else {
		route.Handler(handler)
	}

	r.log.Debug("registered FunctionsHandler",
		zap.String("operation", operation.Name),
		zap.String("path", apiPath),
		zap.String("method", operation.OperationType.String()),
	)

	return nil
}

type FunctionsHandler struct {
	operation            *wgpb.Operation
	log                  *zap.Logger
	variablesValidator   *inputvariables.Validator
	rbacEnforcer         *authentication.RBACEnforcer
	hooksClient          *hooks.Client
	queryParamsAllowList []string
	stringInterpolator   *interpolate.StringInterpolator
	liveQuery            liveQueryConfig
}

func (h *FunctionsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	reqID := r.Header.Get(logging.RequestIDHeader)
	requestLogger := h.log.With(logging.WithRequestID(reqID))
	r = r.WithContext(context.WithValue(r.Context(), logging.RequestIDKey{}, reqID))

	r = setOperationMetaData(r, h.operation)

	isInternal := strings.HasPrefix(r.URL.Path, "/internal/")

	ctx := pool.GetCtx(r, r, pool.Config{})
	defer pool.PutCtx(ctx)

	if proceed := h.rbacEnforcer.Enforce(r); !proceed {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	variablesBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(variablesBuf)

	ct := r.Header.Get("Content-Type")
	if r.Method == http.MethodGet {
		ctx.Variables = parseQueryVariables(r, h.queryParamsAllowList)
	} else if ct == "application/x-www-form-urlencoded" {
		ctx.Variables = h.parseFormVariables(r)
	} else {
		_, err := io.Copy(variablesBuf, r.Body)
		if err != nil {
			requestLogger.Error("failed to copy variables buf", zap.Error(err))
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if isInternal {
			ctx.Variables, _, _, _ = jsonparser.Get(variablesBuf.Bytes(), "input")
		} else {
			ctx.Variables = variablesBuf.Bytes()
		}
	}

	if len(ctx.Variables) == 0 {
		ctx.Variables = []byte("{}")
	} else {
		ctx.Variables = h.stringInterpolator.Interpolate(ctx.Variables)
	}

	variablesBuf.Reset()
	err := json.Compact(variablesBuf, ctx.Variables)
	if err != nil {
		requestLogger.Error("failed to compact variables", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	ctx.Variables = variablesBuf.Bytes()

	if !validateInputVariables(ctx, requestLogger, ctx.Variables, h.variablesValidator, w) {
		return
	}

	isLive := h.liveQuery.enabled && r.URL.Query().Get(WG_LIVE) == "true"

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	input := hookBaseData(r, buf.Bytes(), ctx.Variables, nil)

	switch {
	case isLive:
		h.handleLiveQuery(ctx, w, r, input, requestLogger)
	case h.operation.OperationType == wgpb.OperationType_SUBSCRIPTION:
		h.handleSubscriptionRequest(ctx, w, r, input, requestLogger)
	default:
		h.handleRequest(ctx, w, input, requestLogger)
	}
}

func (h *FunctionsHandler) handleLiveQuery(ctx context.Context, w http.ResponseWriter, r *http.Request, input []byte, requestLogger *zap.Logger) {

	var (
		err error
		fw  *httpFlushWriter
		ok  bool
		out *hooks.MiddlewareHookResponse
	)

	ctx, fw, ok = getFlushWriter(ctx, input, r, w)
	if !ok {
		requestLogger.Error("request doesn't support flushing")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	for {
		select {
		case <-ctx.Done():
			return
		default:
			out, err = h.hooksClient.DoFunctionRequest(ctx, h.operation.Path, input)
			if err != nil {
				if ctx.Err() != nil {
					return
				}
				requestLogger.Error("failed to execute function", zap.Error(err))
				return
			}
			_, err = fw.Write(out.Response)
			if err != nil {
				requestLogger.Error("failed to write response", zap.Error(err))
				return
			}
			fw.Flush()
			time.Sleep(time.Duration(h.liveQuery.pollingIntervalSeconds) * time.Second)
		}
	}
}

func (h *FunctionsHandler) handleRequest(ctx context.Context, w http.ResponseWriter, input []byte, requestLogger *zap.Logger) {
	out, err := h.hooksClient.DoFunctionRequest(ctx, h.operation.Path, input)
	if err != nil {
		if ctx.Err() != nil {
			requestLogger.Debug("request cancelled")
			return
		}
		requestLogger.Error("failed to call function", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(out.ClientResponseStatusCode)
	if len(out.Response) > 0 {
		_, _ = w.Write(out.Response)
	}
}

func (h *FunctionsHandler) handleSubscriptionRequest(ctx context.Context, w http.ResponseWriter, r *http.Request, input []byte, requestLogger *zap.Logger) {
	setSubscriptionHeaders(w)
	subscribeOnce := r.URL.Query().Get("wg_subscribe_once") == "true"
	sse := r.URL.Query().Get("wg_sse") == "true"
	err := h.hooksClient.DoFunctionSubscriptionRequest(ctx, h.operation.Path, input, subscribeOnce, sse, w)
	if err != nil {
		if ctx.Err() != nil {
			requestLogger.Debug("request cancelled")
			return
		}
		requestLogger.Error("failed to call function", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (h *FunctionsHandler) parseFormVariables(r *http.Request) []byte {
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

type EndpointUnavailableHandler struct {
	OperationName string
	Logger        *zap.Logger
}

func (m *EndpointUnavailableHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	m.Logger.Error("operation not available", zap.String("operationName", m.OperationName), zap.String("URL", r.URL.Path))
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

func getFlushWriter(ctx context.Context, variables []byte, r *http.Request, w http.ResponseWriter) (context.Context, *httpFlushWriter, bool) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		return ctx, nil, false
	}

	subscribeOnce := r.URL.Query().Get("wg_subscribe_once") == "true"
	sse := r.URL.Query().Get("wg_sse") == "true"

	if !subscribeOnce {
		setSubscriptionHeaders(w)
	}

	flusher.Flush()

	flushWriter := &httpFlushWriter{
		writer:    w,
		flusher:   flusher,
		sse:       sse,
		buf:       &bytes.Buffer{},
		ctx:       ctx,
		variables: variables,
	}

	if subscribeOnce {
		flushWriter.subscribeOnce = true
		ctx, flushWriter.close = context.WithCancel(ctx)
	}

	return ctx, flushWriter, true
}

func handleHookOut(ctx *resolve.Context, w http.ResponseWriter, log *zap.Logger, out *hooks.MiddlewareHookResponse, errorMessage string, operation *wgpb.Operation) (done bool) {
	if out == nil {
		log.Error(errorMessage,
			zap.String("operationName", operation.Name),
			zap.String("operationType", operation.OperationType.String()),
		)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return true
	}
	updateContextHeaders(ctx, out.SetClientRequestHeaders)
	return false
}

func handleOperationErr(log *zap.Logger, err error, w http.ResponseWriter, errorMessage string, operation *wgpb.Operation) (done bool) {
	if err == nil {
		return false
	}
	if errors.Is(err, context.Canceled) {
		// client closed connection
		w.WriteHeader(499)
		return true
	}
	if errors.Is(err, context.DeadlineExceeded) {
		// request timeout exceeded
		log.Error("request timeout exceeded",
			zap.String("operationName", operation.Name),
			zap.String("operationType", operation.OperationType.String()),
		)
		w.WriteHeader(http.StatusGatewayTimeout)
		return true
	}
	log.Error(errorMessage,
		zap.String("operationName", operation.Name),
		zap.String("operationType", operation.OperationType.String()),
		zap.Error(err),
	)
	http.Error(w, errorMessage, http.StatusInternalServerError)
	return true
}

func validateInputVariables(ctx context.Context, log *zap.Logger, variables []byte, validator *inputvariables.Validator, w http.ResponseWriter) bool {
	var buf bytes.Buffer
	valid, err := validator.Validate(ctx, variables, &buf)
	if err != nil {
		log.Error("failed to validate input variables", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return false
	}
	if !valid {
		w.WriteHeader(http.StatusBadRequest)
		if _, err := io.Copy(w, &buf); err != nil {
			log.Error("copying validation to response", zap.Error(err))
		}
		return false
	}
	return true
}
