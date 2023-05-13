package apihandler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/buger/jsonparser"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"github.com/hashicorp/go-multierror"
	"github.com/hashicorp/go-uuid"
	"github.com/mattbaird/jsonpatch"
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
	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/cacheheaders"
	"github.com/wundergraph/wundergraph/pkg/engineconfigloader"
	"github.com/wundergraph/wundergraph/pkg/graphiql"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/inputvariables"
	"github.com/wundergraph/wundergraph/pkg/interpolate"
	"github.com/wundergraph/wundergraph/pkg/jsonpath"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/postresolvetransform"
	"github.com/wundergraph/wundergraph/pkg/s3uploadclient"
	"github.com/wundergraph/wundergraph/pkg/webhookhandler"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	WgInternalApiCallHeader = "X-WG-Internal-GraphQL-API"

	WgPrefix             = "wg_"
	WgVariables          = WgPrefix + "variables"
	WgLiveParam          = WgPrefix + "live"
	WgJsonPatchParam     = WgPrefix + "json_patch"
	WgSseParam           = WgPrefix + "sse"
	WgSubscribeOnceParam = WgPrefix + "subscribe_once"
)

type WgRequestParams struct {
	UseJsonPatch bool
	UseSse       bool
	SubsribeOnce bool
}

func NewWgRequestParams(r *http.Request) WgRequestParams {
	q := r.URL.Query()
	return WgRequestParams{
		UseJsonPatch: q.Has(WgJsonPatchParam),
		UseSse:       q.Has(WgSseParam),
		SubsribeOnce: q.Has(WgSubscribeOnceParam),
	}
}

type Builder struct {
	router   *mux.Router
	loader   *engineconfigloader.EngineConfigLoader
	api      *Api
	resolver *resolve.Resolver
	pool     *pool.Pool

	middlewareClient *hooks.Client

	definition *ast.Document

	log *zap.Logger

	planConfig plan.Configuration

	insecureCookies      bool
	forceHttpsRedirects  bool
	enableRequestLogging bool
	enableIntrospection  bool
	devMode              bool

	renameTypeNames []resolve.RenameTypeName

	githubAuthDemoClientID     string
	githubAuthDemoClientSecret string
}

type BuilderConfig struct {
	InsecureCookies            bool
	ForceHttpsRedirects        bool
	EnableRequestLogging       bool
	EnableIntrospection        bool
	GitHubAuthDemoClientID     string
	GitHubAuthDemoClientSecret string
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
		forceHttpsRedirects:        config.ForceHttpsRedirects,
		enableRequestLogging:       config.EnableRequestLogging,
		enableIntrospection:        config.EnableIntrospection,
		githubAuthDemoClientID:     config.GitHubAuthDemoClientID,
		githubAuthDemoClientSecret: config.GitHubAuthDemoClientSecret,
		devMode:                    config.DevMode,
	}
}

func (r *Builder) BuildAndMountApiHandler(ctx context.Context, router *mux.Router, api *Api) (streamClosers []chan struct{}, err error) {
	r.api = api

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

	planConfig, err := r.loader.Load(*api.EngineConfiguration, api.Options.ServerUrl)
	if err != nil {
		return streamClosers, err
	}

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

	if r.enableRequestLogging {
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

	if err := r.registerAuth(r.insecureCookies); err != nil {
		if !r.devMode {
			// If authentication fails in production, consider this a fatal error
			return streamClosers, err
		}
		r.log.Error("configuring auth", zap.Error(err))
	}

	for _, s3Provider := range api.S3UploadConfiguration {
		profiles := make(map[string]*s3uploadclient.UploadProfile, len(s3Provider.UploadProfiles))
		for name, profile := range s3Provider.UploadProfiles {
			profiles[name] = &s3uploadclient.UploadProfile{
				RequireAuthentication: profile.RequireAuthentication,
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
			r.log.Error("unable to register S3 provider",
				zap.Error(err),
				zap.String("provider", s3Provider.Name),
				zap.String("endpoint", loadvariable.String(s3Provider.Endpoint)),
			)
		} else {
			s3Path := fmt.Sprintf("/s3/%s/upload", s3Provider.Name)
			r.router.Handle(s3Path, http.HandlerFunc(s3.UploadFile))
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
			return streamClosers, err
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
	handler, err := webhookhandler.New(config, r.api.Options.ServerUrl, r.log)
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
	if shared.Report.HasErrors() {
		return fmt.Errorf(ErrMsgOperationPlanningFailed, shared.Report)
	}
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

	hooksPipelineCommonConfig := hooks.PipelineConfig{
		Client:      r.middlewareClient,
		Operation:   operation,
		Transformer: postResolveTransformer,
		Logger:      r.log,
	}

	switch operation.OperationType {
	case wgpb.OperationType_QUERY:
		synchronousPlan, ok := preparedPlan.(*plan.SynchronousResponsePlan)
		if !ok {
			break
		}
		hooksPipelineConfig := hooks.SynchronousOperationPipelineConfig{
			PipelineConfig: hooksPipelineCommonConfig,
			Resolver:       r.resolver,
			Plan:           synchronousPlan,
		}
		hooksPipeline := hooks.NewSynchonousOperationPipeline(hooksPipelineConfig)
		handler := &QueryHandler{
			resolver:               r.resolver,
			log:                    r.log,
			preparedPlan:           synchronousPlan,
			pool:                   r.pool,
			extractedVariables:     make([]byte, len(shared.Doc.Input.Variables)),
			cacheHeaders:           cacheheaders.New(newCacheControl(operation.CacheConfig), r.api.ApiConfigHash),
			operation:              operation,
			variablesValidator:     variablesValidator,
			rbacEnforcer:           authentication.NewRBACEnforcer(operation),
			stringInterpolator:     stringInterpolator,
			jsonStringInterpolator: jsonStringInterpolator,
			postResolveTransformer: postResolveTransformer,
			renameTypeNames:        r.renameTypeNames,
			queryParamsAllowList:   queryParamsAllowList,
			hooksPipeline:          hooksPipeline,
		}

		if operation.LiveQueryConfig != nil && operation.LiveQueryConfig.Enable {
			handler.liveQuery = liveQueryConfig{
				enabled:                true,
				pollingIntervalSeconds: operation.LiveQueryConfig.PollingIntervalSeconds,
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
			zap.String("cache", handler.cacheHeaders.String()),
			zap.Bool("authRequired", operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired),
		)
	case wgpb.OperationType_MUTATION:
		synchronousPlan, ok := preparedPlan.(*plan.SynchronousResponsePlan)
		if !ok {
			break
		}
		hooksPipelineConfig := hooks.SynchronousOperationPipelineConfig{
			PipelineConfig: hooksPipelineCommonConfig,
			Resolver:       r.resolver,
			Plan:           synchronousPlan,
		}
		hooksPipeline := hooks.NewSynchonousOperationPipeline(hooksPipelineConfig)
		handler := &MutationHandler{
			resolver:               r.resolver,
			log:                    r.log,
			preparedPlan:           synchronousPlan,
			pool:                   r.pool,
			extractedVariables:     make([]byte, len(shared.Doc.Input.Variables)),
			cacheHeaders:           cacheheaders.New(newCacheControl(operation.CacheConfig), r.api.ApiConfigHash),
			operation:              operation,
			variablesValidator:     variablesValidator,
			rbacEnforcer:           authentication.NewRBACEnforcer(operation),
			stringInterpolator:     stringInterpolator,
			jsonStringInterpolator: jsonStringInterpolator,
			postResolveTransformer: postResolveTransformer,
			renameTypeNames:        r.renameTypeNames,
			hooksPipeline:          hooksPipeline,
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
		hooksPipelineConfig := hooks.SubscriptionOperationPipelineConfig{
			PipelineConfig: hooksPipelineCommonConfig,
			Resolver:       r.resolver,
			Plan:           subscriptionPlan,
		}
		hooksPipeline := hooks.NewSubscriptionOperationPipeline(hooksPipelineConfig)
		handler := &SubscriptionHandler{
			resolver:               r.resolver,
			log:                    r.log,
			preparedPlan:           subscriptionPlan,
			pool:                   r.pool,
			extractedVariables:     make([]byte, len(shared.Doc.Input.Variables)),
			cacheHeaders:           cacheheaders.New(newCacheControl(operation.CacheConfig), r.api.ApiConfigHash),
			operation:              operation,
			variablesValidator:     variablesValidator,
			rbacEnforcer:           authentication.NewRBACEnforcer(operation),
			stringInterpolator:     stringInterpolator,
			jsonStringInterpolator: jsonStringInterpolator,
			postResolveTransformer: postResolveTransformer,
			renameTypeNames:        r.renameTypeNames,
			queryParamsAllowList:   queryParamsAllowList,
			hooksPipeline:          hooksPipeline,
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

func (r *Builder) Close() error {
	return nil
}

type GraphQLPlaygroundHandler struct {
	log     *zap.Logger
	html    string
	nodeUrl string
}

func (h *GraphQLPlaygroundHandler) ServeHTTP(w http.ResponseWriter, _ *http.Request) {
	tpl := strings.Replace(h.html, "{{apiURL}}", h.nodeUrl, -1)
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
	shared.Doc.Input.ResetInputString(requestQuery)
	shared.Parser.Parse(shared.Doc, shared.Report)

	if shared.Report.HasErrors() {
		h.logInternalErrors(shared.Report, requestLogger)
		h.writeRequestErrors(shared.Report, w, requestLogger)

		w.WriteHeader(http.StatusBadRequest)
		return
	}

	prepared, err := h.preparePlan(requestOperationName, shared)
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

	if len(prepared.variables) != 0 {
		// we have to merge query variables into extracted variables to been able to override default values
		// we make a copy of the extracted variables to not override h.extractedVariables
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
		shared.Ctx, flushWriter, ok = getFlushWriter(shared.Ctx, shared.Ctx.Variables, r, w)
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

func (h *GraphQLHandler) preparePlan(requestOperationName []byte, shared *pool.Shared) (planWithExtractedVariables, error) {
	if len(requestOperationName) == 0 {
		shared.Normalizer.NormalizeOperation(shared.Doc, h.definition, shared.Report)
	} else {
		shared.Normalizer.NormalizeNamedOperation(shared.Doc, h.definition, requestOperationName, shared.Report)
	}
	if shared.Report.HasErrors() {
		return planWithExtractedVariables{}, fmt.Errorf(ErrMsgOperationNormalizationFailed, shared.Report)
	}

	state := shared.Validation.Validate(shared.Doc, h.definition, shared.Report)
	if state != astvalidation.Valid {
		return planWithExtractedVariables{}, errInvalid
	}

	preparedPlan := shared.Planner.Plan(shared.Doc, h.definition, unsafebytes.BytesToString(requestOperationName), shared.Report)
	shared.Postprocess.Process(preparedPlan)

	prepared := planWithExtractedVariables{
		preparedPlan: preparedPlan,
		variables:    shared.Doc.Input.Variables,
	}
	return prepared, nil
}

func postProcessVariables(operation *wgpb.Operation, r *http.Request, variables []byte) ([]byte, error) {
	var err error
	variables, err = injectClaims(operation, r, variables)
	if err != nil {
		return nil, err
	}
	variables = injectVariables(operation, r, variables)
	return variables, nil
}

func injectWellKnownClaim(claim *wgpb.ClaimConfig, user *authentication.User, variables []byte) ([]byte, error) {
	var err error
	var replacement string

	switch claim.ClaimType {
	case wgpb.ClaimType_ISSUER:
		replacement = user.ProviderID
	case wgpb.ClaimType_SUBJECT: // handles  wgpb.ClaimType_USERID too
		replacement = user.UserID
	case wgpb.ClaimType_NAME:
		replacement = user.Name
	case wgpb.ClaimType_GIVEN_NAME:
		replacement = user.FirstName
	case wgpb.ClaimType_FAMILY_NAME:
		replacement = user.LastName
	case wgpb.ClaimType_MIDDLE_NAME:
		replacement = user.MiddleName
	case wgpb.ClaimType_NICKNAME:
		replacement = user.NickName
	case wgpb.ClaimType_PREFERRED_USERNAME:
		replacement = user.PreferredUsername
	case wgpb.ClaimType_PROFILE:
		replacement = user.Profile
	case wgpb.ClaimType_PICTURE:
		replacement = user.Picture
	case wgpb.ClaimType_WEBSITE:
		replacement = user.Website
	case wgpb.ClaimType_EMAIL:
		replacement = user.Email
	case wgpb.ClaimType_EMAIL_VERIFIED:
		var boolValue string
		if user.EmailVerified {
			boolValue = "true"
		} else {
			boolValue = "false"
		}
		variables, err = jsonparser.Set(variables, []byte(boolValue), claim.VariablePathComponents...)
		if err != nil {
			return nil, fmt.Errorf("error replacing variable for claim %s: %w", claim.ClaimType, err)
		}
		// Don't go into the block after the switch that sets the variable as a string
		return variables, nil
	case wgpb.ClaimType_GENDER:
		replacement = user.Gender
	case wgpb.ClaimType_BIRTH_DATE:
		replacement = user.BirthDate
	case wgpb.ClaimType_ZONE_INFO:
		replacement = user.ZoneInfo
	case wgpb.ClaimType_LOCALE:
		replacement = user.Locale
	case wgpb.ClaimType_LOCATION:
		replacement = user.Location
	default:
		return nil, fmt.Errorf("unhandled well known claim %s", claim.ClaimType)
	}
	variables, err = jsonparser.Set(variables, []byte("\""+replacement+"\""), claim.VariablePathComponents...)
	if err != nil {
		return nil, fmt.Errorf("error replacing variable for well known claim %s: %w", claim.ClaimType, err)
	}

	return variables, nil
}

func injectCustomClaim(claim *wgpb.ClaimConfig, user *authentication.User, variables []byte) ([]byte, error) {
	custom := claim.GetCustom()
	value := jsonpath.GetKeys(user.CustomClaims, custom.JsonPathComponents...)
	var replacement []byte
	switch x := value.(type) {
	case nil:
		if custom.Required {
			return nil, inputvariables.NewValidationError(fmt.Sprintf("required customClaim %s not found", custom.Name), nil, nil)
		}
		return variables, nil
	case string:
		if custom.Type != wgpb.ValueType_STRING && custom.Type != wgpb.ValueType_ANY {
			return nil, inputvariables.NewValidationError(
				fmt.Sprintf("customClaim %s expected to be of type %s, found %T instead", custom.Name, custom.Type, x),
				nil,
				nil,
			)
		}
		replacement = []byte("\"" + string(x) + "\"")
	case bool:
		if custom.Type != wgpb.ValueType_BOOLEAN && custom.Type != wgpb.ValueType_ANY {
			return nil, inputvariables.NewValidationError(
				fmt.Sprintf("customClaim %s expected to be of type %s, found %T instead", custom.Name, custom.Type, x),
				nil,
				nil,
			)
		}
		if x {
			replacement = []byte("true")
		} else {
			replacement = []byte("false")
		}
	case float64:
		switch custom.Type {
		case wgpb.ValueType_INT:
			if x != float64(int(x)) {
				// Value is not integral
				return nil, inputvariables.NewValidationError(
					fmt.Sprintf("customClaim %s expected to be of type %s, found %s instead", custom.Name, custom.Type, "float"),
					nil,
					nil,
				)
			}
			replacement = []byte(strconv.FormatInt(int64(x), 10))
		case wgpb.ValueType_FLOAT, wgpb.ValueType_ANY:
			// JSON number is always a valid float
			replacement = []byte(strconv.FormatFloat(x, 'f', -1, 64))
		default:
			return nil, inputvariables.NewValidationError(
				fmt.Sprintf("customClaim %s expected to be of type %s, found %T instead", custom.Name, custom.Type, x),
				nil,
				nil,
			)
		}
	default:
		if custom.Type != wgpb.ValueType_ANY {
			return nil, inputvariables.NewValidationError(
				fmt.Sprintf("customClaim %s expected to be of type %s, found %T instead", custom.Name, custom.Type, x),
				nil,
				nil,
			)
		}
		var err error
		replacement, err = json.Marshal(value)
		if err != nil {
			return nil, fmt.Errorf("error serializing data %v for custom claim %s: %w", value, custom.Name, err)
		}
	}
	var err error
	variables, err = jsonparser.Set(variables, replacement, claim.VariablePathComponents...)
	if err != nil {
		return nil, fmt.Errorf("error replacing variable for customClaim %s: %w", custom.Name, err)
	}
	return variables, nil
}

func injectClaims(operation *wgpb.Operation, r *http.Request, variables []byte) ([]byte, error) {
	authorizationConfig := operation.GetAuthorizationConfig()
	claims := authorizationConfig.GetClaims()
	if len(claims) == 0 {
		return variables, nil
	}
	user := authentication.UserFromContext(r.Context())
	if user == nil {
		return variables, nil
	}
	var err error
	for _, claim := range claims {
		if claim.GetClaimType() == wgpb.ClaimType_CUSTOM {
			variables, err = injectCustomClaim(claim, user, variables)
		} else {
			variables, err = injectWellKnownClaim(claim, user, variables)
		}
	}
	if err != nil {
		return nil, err
	}
	return variables, nil
}

func injectVariables(operation *wgpb.Operation, _ *http.Request, variables []byte) []byte {
	if operation.VariablesConfiguration == nil || operation.VariablesConfiguration.InjectVariables == nil {
		return variables
	}
	for i := range operation.VariablesConfiguration.InjectVariables {
		keys := operation.VariablesConfiguration.InjectVariables[i].VariablePathComponents
		kind := operation.VariablesConfiguration.InjectVariables[i].VariableKind
		switch kind {
		case wgpb.InjectVariableKind_UUID:
			id, _ := uuid.GenerateUUID()
			variables, _ = jsonparser.Set(variables, []byte("\""+id+"\""), keys...)
		case wgpb.InjectVariableKind_DATE_TIME:
			format := operation.VariablesConfiguration.InjectVariables[i].DateFormat
			now := time.Now()
			dateTime := now.Format(format)
			variables, _ = jsonparser.Set(variables, []byte("\""+dateTime+"\""), keys...)
		case wgpb.InjectVariableKind_ENVIRONMENT_VARIABLE:
			value := os.Getenv(operation.VariablesConfiguration.InjectVariables[i].EnvironmentVariableName)
			if value == "" {
				continue
			}
			variables, _ = jsonparser.Set(variables, []byte("\""+value+"\""), keys...)
		}
	}
	return variables
}

type QueryResolver interface {
	ResolveGraphQLResponse(ctx *resolve.Context, response *resolve.GraphQLResponse, data []byte, writer io.Writer) (err error)
}

type SubscriptionResolver interface {
	ResolveGraphQLSubscription(ctx *resolve.Context, subscription *resolve.GraphQLSubscription, writer resolve.FlushWriter) (err error)
}

type liveQueryConfig struct {
	enabled                bool
	pollingIntervalSeconds int64
}

func parseQueryVariables(r *http.Request, allowList []string) []byte {
	rawVariables := r.URL.Query().Get(WgVariables)
	if rawVariables == "" {
		rawVariables = "{}"
		for name, val := range r.URL.Query() {
			if len(val) > 0 && !strings.HasPrefix(name, WgPrefix) {
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
	cacheHeaders           *cacheheaders.Headers
	liveQuery              liveQueryConfig
	operation              *wgpb.Operation
	variablesValidator     *inputvariables.Validator
	rbacEnforcer           *authentication.RBACEnforcer
	stringInterpolator     *interpolate.StringInterpolator
	jsonStringInterpolator *interpolate.StringInterpolator
	postResolveTransformer *postresolvetransform.Transformer
	renameTypeNames        []resolve.RenameTypeName
	queryParamsAllowList   []string
	hooksPipeline          *hooks.SynchronousOperationPipeline
}

func (h *QueryHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	requestLogger := h.log.With(logging.WithRequestIDFromContext(r.Context()))
	r = setOperationMetaData(r, h.operation)

	if proceed := h.rbacEnforcer.Enforce(r); !proceed {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	isLive := h.liveQuery.enabled && r.URL.Query().Has(WgLiveParam)

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	ctx := pool.GetCtx(r, r, pool.Config{
		RenameTypeNames: h.renameTypeNames,
	})
	defer pool.PutCtx(ctx)

	ctx.Variables = parseQueryVariables(r, h.queryParamsAllowList)
	ctx.Variables = h.stringInterpolator.Interpolate(ctx.Variables)

	if !validateInputVariables(ctx.Context(), requestLogger, ctx.Variables, h.variablesValidator, w) {
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
		// we make a copy of the extracted variables to not override h.extractedVariables
		ctx.Variables = MergeJsonRightIntoLeft(h.extractedVariables, ctx.Variables)
	}

	ctx.Variables, err = postProcessVariables(h.operation, r, ctx.Variables)
	if err != nil {
		if done := handleOperationErr(requestLogger, err, w, "postProcessVariables failed", h.operation); done {
			return
		}
	}

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

	if isLive {
		h.handleLiveQuery(r, w, ctx, buf, flusher, requestLogger)
		return
	}

	resp, err := h.hooksPipeline.Run(ctx, w, r, buf)
	if done := handleOperationErr(requestLogger, err, w, "hooks pipeline failed", h.operation); done {
		return
	}

	if resp.Done {
		return
	}

	if h.cacheHeaders != nil {
		h.cacheHeaders.Set(r, w, resp.Data)
		if h.cacheHeaders.NotModified(r, w) {
			return
		}
	}

	_, err = w.Write(resp.Data)
	if done := handleOperationErr(requestLogger, err, w, "writing response failed", h.operation); done {
		return
	}
}

func (h *QueryHandler) handleLiveQueryEvent(ctx *resolve.Context, w http.ResponseWriter, r *http.Request, requestBuf *bytes.Buffer, hookBuf *bytes.Buffer) ([]byte, error) {

	requestBuf.Reset()
	hooksResponse, err := h.hooksPipeline.Run(ctx, w, r, requestBuf)
	if err != nil {
		return nil, fmt.Errorf("handleLiveQueryEvent: %w", err)
	}

	if hooksResponse.Done {
		// Response is already written by hooks pipeline, tell
		// caller to stop
		return nil, context.Canceled
	}

	return hooksResponse.Data, nil
}

func (h *QueryHandler) handleLiveQuery(r *http.Request, w http.ResponseWriter, ctx *resolve.Context, requestBuf *bytes.Buffer, flusher http.Flusher, requestLogger *zap.Logger) {
	wgParams := NewWgRequestParams(r)

	done := ctx.Context().Done()

	hookBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(hookBuf)

	lastData := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(lastData)

	currentData := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(currentData)

	if wgParams.UseSse {
		defer func() {
			_, _ = fmt.Fprintf(w, "event: close\n\n")
			flusher.Flush()
		}()
	}

	for {
		var hookError bool
		response, err := h.handleLiveQueryEvent(ctx, w, r, requestBuf, hookBuf)
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

		// only send the response if the content has changed
		if !bytes.Equal(response, lastData.Bytes()) {
			currentData.Reset()
			_, _ = currentData.Write(response)
			if wgParams.UseSse {
				_, _ = w.Write([]byte("data: "))
			}
			if wgParams.SubsribeOnce {
				flusher.Flush()
				return
			}
			if wgParams.UseJsonPatch && lastData.Len() != 0 {
				last := lastData.Bytes()
				current := currentData.Bytes()
				patch, err := jsonpatch.CreatePatch(last, current)
				if err != nil {
					requestLogger.Error("HandleLiveQueryEvent could not create json patch", zap.Error(err))
					continue
				}
				patchBytes, err := json.Marshal(patch)
				if err != nil {
					requestLogger.Error("HandleLiveQueryEvent could not marshal json patch", zap.Error(err))
					continue
				}
				// we only send the patch if it's smaller than the full response
				if len(patchBytes) < len(current) {
					_, err = w.Write(patchBytes)
					if err != nil {
						requestLogger.Error("HandleLiveQueryEvent could not write json patch", zap.Error(err))
						return
					}
				} else {
					_, err = w.Write(current)
					if err != nil {
						requestLogger.Error("HandleLiveQueryEvent could not write response", zap.Error(err))
						return
					}
				}
			} else {
				_, err = w.Write(currentData.Bytes())
			}
			if err != nil {
				requestLogger.Error("HandleLiveQueryEvent could not write response", zap.Error(err))
				return
			}
			_, _ = w.Write(literal.LINETERMINATOR)
			_, err = w.Write(literal.LINETERMINATOR)
			if err != nil {
				return
			}
			flusher.Flush()
			lastData.Reset()
			_, _ = lastData.Write(currentData.Bytes())
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
	cacheHeaders           *cacheheaders.Headers
	pool                   *pool.Pool
	operation              *wgpb.Operation
	variablesValidator     *inputvariables.Validator
	rbacEnforcer           *authentication.RBACEnforcer
	stringInterpolator     *interpolate.StringInterpolator
	jsonStringInterpolator *interpolate.StringInterpolator
	postResolveTransformer *postresolvetransform.Transformer
	renameTypeNames        []resolve.RenameTypeName
	hooksPipeline          *hooks.SynchronousOperationPipeline
}

func (h *MutationHandler) parseFormVariables(r *http.Request) []byte {
	rawVariables := "{}"
	if err := r.ParseForm(); err == nil {
		for name, val := range r.Form {
			if len(val) == 0 || strings.HasSuffix(val[0], WgPrefix) {
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

	if !validateInputVariables(ctx.Context(), requestLogger, ctx.Variables, h.variablesValidator, w) {
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
		// we make a copy of the extracted variables to not override h.extractedVariables
		ctx.Variables = MergeJsonRightIntoLeft(h.extractedVariables, ctx.Variables)
	}

	ctx.Variables, err = postProcessVariables(h.operation, r, ctx.Variables)
	if err != nil {
		if done := handleOperationErr(requestLogger, err, w, "postProcessVariables failed", h.operation); done {
			return
		}
	}

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	resp, err := h.hooksPipeline.Run(ctx, w, r, buf)
	if done := handleOperationErr(requestLogger, err, w, "hooks pipeline failed", h.operation); done {
		return
	}

	if resp.Done {
		return
	}

	if h.cacheHeaders != nil {
		h.cacheHeaders.Set(r, w, resp.Data)
	}

	reader := bytes.NewReader(resp.Data)
	_, err = reader.WriteTo(w)
	if done := handleOperationErr(requestLogger, err, w, "writing response failed", h.operation); done {
		return
	}
}

type SubscriptionHandler struct {
	resolver               SubscriptionResolver
	log                    *zap.Logger
	preparedPlan           *plan.SubscriptionResponsePlan
	extractedVariables     []byte
	cacheHeaders           *cacheheaders.Headers
	pool                   *pool.Pool
	operation              *wgpb.Operation
	variablesValidator     *inputvariables.Validator
	rbacEnforcer           *authentication.RBACEnforcer
	stringInterpolator     *interpolate.StringInterpolator
	jsonStringInterpolator *interpolate.StringInterpolator
	postResolveTransformer *postresolvetransform.Transformer
	renameTypeNames        []resolve.RenameTypeName
	queryParamsAllowList   []string
	hooksPipeline          *hooks.SubscriptionOperationPipeline
}

func (h *SubscriptionHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	requestLogger := h.log.With(logging.WithRequestIDFromContext(r.Context()))
	r = setOperationMetaData(r, h.operation)

	// recover from panic if one occured. Set err to nil otherwise.
	defer func() {
		if r := recover(); r != nil {
			requestLogger.Error("panic recovered", zap.Any("panic", r))
			w.WriteHeader(http.StatusInternalServerError)
		}
	}()

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

	if !validateInputVariables(ctx.Context(), requestLogger, ctx.Variables, h.variablesValidator, w) {
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
		// we make a copy of the extracted variables to not override h.extractedVariables
		ctx.Variables = MergeJsonRightIntoLeft(h.extractedVariables, ctx.Variables)
	}

	ctx.Variables, err = postProcessVariables(h.operation, r, ctx.Variables)
	if err != nil {
		if done := handleOperationErr(requestLogger, err, w, "postProcessVariables failed", h.operation); done {
			return
		}
	}

	ctx, flushWriter, ok := getHooksFlushWriter(ctx, r, w, h.hooksPipeline, h.log)
	if !ok {
		http.Error(w, "Connection not flushable", http.StatusBadRequest)
		return
	}

	if h.cacheHeaders != nil {
		h.cacheHeaders.Set(r, w, nil)
	}

	_, err = h.hooksPipeline.RunSubscription(ctx, flushWriter, r)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			// e.g. client closed connection
			return
		}
		// if the deadline is exceeded (e.g. timeout), we don't have to return an HTTP error
		// we've already flushed a response to the client
		requestLogger.Error("ResolveGraphQLSubscription", zap.Error(err))
	}
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
	ctx                    context.Context
	writer                 http.ResponseWriter
	flusher                http.Flusher
	postResolveTransformer *postresolvetransform.Transformer
	subscribeOnce          bool
	sse                    bool
	useJsonPatch           bool
	close                  func()
	buf                    *bytes.Buffer
	lastMessage            *bytes.Buffer
	variables              []byte

	// Used for hooks
	resolveContext *resolve.Context
	request        *http.Request
	hooksPipeline  *hooks.SubscriptionOperationPipeline
	logger         *zap.Logger
}

func (f *httpFlushWriter) Header() http.Header {
	return f.writer.Header()
}

func (f *httpFlushWriter) WriteHeader(statusCode int) {
	f.writer.WriteHeader(statusCode)
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

func (f *httpFlushWriter) Close() {
	if f.sse {
		_, _ = f.writer.Write([]byte("event: done\n\n"))
		f.flusher.Flush()
	}
}

func (f *httpFlushWriter) Flush() {
	resp := f.buf.Bytes()
	f.buf.Reset()

	if f.hooksPipeline != nil {
		postResolveResponse, err := f.hooksPipeline.PostResolve(f.resolveContext, nil, f.request, resp)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				return
			}
			if f.logger != nil {
				f.logger.Error("subscription postResolve hooks", zap.Error(err))
			}
		} else {
			resp = postResolveResponse.Data
		}
	}

	if f.useJsonPatch && f.lastMessage.Len() != 0 {
		last := f.lastMessage.Bytes()
		patch, err := jsonpatch.CreatePatch(last, resp)
		if err != nil {
			if f.logger != nil {
				f.logger.Error("subscription json patch", zap.Error(err))
			}
			return
		}
		if len(patch) == 0 {
			// no changes
			return
		}
		patchData, err := json.Marshal(patch)
		if err != nil {
			if f.logger != nil {
				f.logger.Error("subscription json patch", zap.Error(err))
			}
			return
		}
		if f.sse {
			_, _ = f.writer.Write([]byte("data: "))
		}
		if len(patchData) < len(resp) {
			_, _ = f.writer.Write(patchData)
		} else {
			_, _ = f.writer.Write(resp)
		}
	}

	if f.lastMessage.Len() == 0 || !f.useJsonPatch {
		if f.sse {
			_, _ = f.writer.Write([]byte("data: "))
		}
		_, _ = f.writer.Write(resp)
	}

	f.lastMessage.Reset()
	_, _ = f.lastMessage.Write(resp)

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
	if len(left) == 0 {
		return right
	}
	if len(right) == 0 {
		return left
	}
	result := gjson.ParseBytes(right)
	result.ForEach(func(key, value gjson.Result) bool {
		left, _ = sjson.SetRawBytes(left, key.Str, unsafebytes.StringToBytes(value.Raw))
		return true
	})
	return left
}

func (r *Builder) authenticationHooks() authentication.Hooks {
	return hooks.NewAuthenticationHooks(hooks.AuthenticationConfig{
		Client:                     r.middlewareClient,
		Log:                        r.log,
		PostAuthentication:         r.api.AuthenticationConfig.Hooks.PostAuthentication,
		MutatingPostAuthentication: r.api.AuthenticationConfig.Hooks.MutatingPostAuthentication,
		PostLogout:                 r.api.AuthenticationConfig.Hooks.PostLogout,
		Revalidate:                 r.api.AuthenticationConfig.Hooks.RevalidateAuthentication,
	})
}

func (r *Builder) registerAuth(insecureCookies bool) error {

	var (
		hashKey, blockKey, csrfSecret []byte
		jwksProviders                 []*wgpb.JwksAuthProvider
	)

	if h := loadvariable.String(r.api.AuthenticationConfig.CookieBased.HashKey); h != "" {
		hashKey = []byte(h)
	} else if fallback := r.api.CookieBasedSecrets.HashKey; fallback != nil {
		hashKey = fallback
	}

	if b := loadvariable.String(r.api.AuthenticationConfig.CookieBased.BlockKey); b != "" {
		blockKey = []byte(b)
	} else if fallback := r.api.CookieBasedSecrets.BlockKey; fallback != nil {
		blockKey = fallback
	}

	if c := loadvariable.String(r.api.AuthenticationConfig.CookieBased.CsrfSecret); c != "" {
		csrfSecret = []byte(c)
	} else if fallback := r.api.CookieBasedSecrets.CsrfSecret; fallback != nil {
		csrfSecret = fallback
	}

	if r.api == nil || r.api.HasCookieAuthEnabled() && (hashKey == nil || blockKey == nil || csrfSecret == nil) {
		panic("API is nil or hashkey, blockkey, csrfsecret invalid: This should never have happened. Either validation didn't detect broken configuration, or someone broke the validation code")
	}

	cookie := securecookie.New(hashKey, blockKey)

	if r.api.AuthenticationConfig.JwksBased != nil {
		jwksProviders = r.api.AuthenticationConfig.JwksBased.Providers
	}

	authHooks := r.authenticationHooks()

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
		Hooks:           authHooks,
		Log:             r.log,
		InsecureCookies: insecureCookies,
		Cookie:          cookie,
		PublicClaims:    r.api.AuthenticationConfig.PublicClaims,
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
		}, r.authenticationHooks())
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
		}, r.authenticationHooks())
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
		cacheHeaders:         cacheheaders.New(newCacheControl(operation.CacheConfig), r.api.ApiConfigHash),
		variablesValidator:   variablesValidator,
		rbacEnforcer:         authentication.NewRBACEnforcer(operation),
		hooksClient:          r.middlewareClient,
		queryParamsAllowList: generateQueryArgumentsAllowList(operation.VariablesSchema),
		stringInterpolator:   stringInterpolator,
		liveQuery: liveQueryConfig{
			enabled:                operation.LiveQueryConfig.Enable,
			pollingIntervalSeconds: operation.LiveQueryConfig.PollingIntervalSeconds,
		},
		internal: false,
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
	cacheHeaders         *cacheheaders.Headers
	variablesValidator   *inputvariables.Validator
	rbacEnforcer         *authentication.RBACEnforcer
	hooksClient          *hooks.Client
	queryParamsAllowList []string
	stringInterpolator   *interpolate.StringInterpolator
	liveQuery            liveQueryConfig
	internal             bool
}

func (h *FunctionsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	reqID := r.Header.Get(logging.RequestIDHeader)
	requestLogger := h.log.With(logging.WithRequestID(reqID))
	r = r.WithContext(context.WithValue(r.Context(), logging.RequestIDKey{}, reqID))

	r = setOperationMetaData(r, h.operation)

	if proceed := h.rbacEnforcer.Enforce(r); !proceed {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	ctx := pool.GetCtx(r, r, pool.Config{})
	defer pool.PutCtx(ctx)

	variablesBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(variablesBuf)

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

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
		if h.internal {
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

	if !validateInputVariables(ctx.Context(), requestLogger, ctx.Variables, h.variablesValidator, w) {
		return
	}

	isLive := h.liveQuery.enabled && r.URL.Query().Has(WgLiveParam)

	input, err := hooks.EncodeData(r, buf, ctx.Variables, nil)
	if done := handleOperationErr(requestLogger, err, w, "encoding hook data failed", h.operation); done {
		return
	}

	switch {
	case isLive:
		h.handleLiveQuery(ctx, w, r, input, requestLogger)
	case h.operation.OperationType == wgpb.OperationType_SUBSCRIPTION:
		h.handleSubscriptionRequest(ctx, w, r, input, requestLogger)
	default:
		h.handleRequest(ctx, r, w, input, requestLogger)
	}
}

func (h *FunctionsHandler) handleLiveQuery(resolveCtx *resolve.Context, w http.ResponseWriter, r *http.Request, input []byte, requestLogger *zap.Logger) {

	var (
		err error
		fw  *httpFlushWriter
		ok  bool
		out *hooks.MiddlewareHookResponse
	)

	resolveCtx, fw, ok = getFlushWriter(resolveCtx, input, r, w)
	if !ok {
		requestLogger.Error("request doesn't support flushing")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	var (
		lastResponse bytes.Buffer
	)

	defer fw.Close()

	ctx := resolveCtx.Context()
	for {
		select {
		case <-ctx.Done():
			return
		default:
			out, err = h.hooksClient.DoFunctionRequest(ctx, h.operation.Path, input, buf)
			if err != nil {
				if ctx.Err() != nil {
					return
				}
				requestLogger.Error("failed to execute function", zap.Error(err))
				return
			}
			if bytes.Equal(out.Response, lastResponse.Bytes()) {
				continue
			}
			_, err = fw.Write(out.Response)
			if err != nil {
				requestLogger.Error("failed to write response", zap.Error(err))
				return
			}
			fw.Flush()
			lastResponse.Reset()
			lastResponse.Write(out.Response)
			time.Sleep(time.Duration(h.liveQuery.pollingIntervalSeconds) * time.Second)
		}
	}
}

func (h *FunctionsHandler) handleRequest(resolveCtx *resolve.Context, r *http.Request, w http.ResponseWriter, input []byte, requestLogger *zap.Logger) {

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	ctx := resolveCtx.Context()

	out, err := h.hooksClient.DoFunctionRequest(ctx, h.operation.Path, input, buf)
	if err != nil {
		if ctx.Err() != nil {
			requestLogger.Debug("request cancelled")
			return
		}
		requestLogger.Error("failed to call function", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if h.cacheHeaders != nil {
		h.cacheHeaders.Set(r, w, out.Response)
		if h.cacheHeaders.NotModified(r, w) {
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(out.ClientResponseStatusCode)
	if len(out.Response) > 0 {
		_, _ = w.Write(out.Response)
	}
}

func (h *FunctionsHandler) handleSubscriptionRequest(resolveCtx *resolve.Context, w http.ResponseWriter, r *http.Request, input []byte, requestLogger *zap.Logger) {
	wgParams := NewWgRequestParams(r)

	setSubscriptionHeaders(w)
	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)
	ctx := resolveCtx.Context()
	err := h.hooksClient.DoFunctionSubscriptionRequest(ctx, h.operation.Path, input, wgParams.SubsribeOnce, wgParams.UseSse, wgParams.UseJsonPatch, w, buf)
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
			if len(val) == 0 || strings.HasSuffix(val[0], WgPrefix) {
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
	if r == nil {
		return nil
	}
	ctx := r.Context()
	if ctx == nil {
		return nil
	}
	maybeMetaData := r.Context().Value("operationMetaData")
	if maybeMetaData == nil {
		return nil
	}
	return maybeMetaData.(*OperationMetaData)
}

func setSubscriptionHeaders(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	// allow unbuffered responses, it's used when it's necessary just to pass response through
	// setting this to “yes” will allow the response to be cached
	w.Header().Set("X-Accel-Buffering", "no")
}

func getHooksFlushWriter(ctx *resolve.Context, r *http.Request, w http.ResponseWriter, pipeline *hooks.SubscriptionOperationPipeline, logger *zap.Logger) (*resolve.Context, *httpFlushWriter, bool) {
	var flushWriter *httpFlushWriter
	var ok bool
	ctx, flushWriter, ok = getFlushWriter(ctx, ctx.Variables, r, w)
	if !ok {
		return nil, nil, false
	}

	flushWriter.resolveContext = ctx
	flushWriter.request = r
	flushWriter.hooksPipeline = pipeline
	flushWriter.logger = logger
	return ctx, flushWriter, true
}

func getFlushWriter(ctx *resolve.Context, variables []byte, r *http.Request, w http.ResponseWriter) (*resolve.Context, *httpFlushWriter, bool) {
	wgParams := NewWgRequestParams(r)

	flusher, ok := w.(http.Flusher)
	if !ok {
		return ctx, nil, false
	}

	if !wgParams.SubsribeOnce {
		setSubscriptionHeaders(w)
	}

	flusher.Flush()

	flushWriter := &httpFlushWriter{
		writer:       w,
		flusher:      flusher,
		sse:          wgParams.UseSse,
		useJsonPatch: wgParams.UseJsonPatch,
		buf:          &bytes.Buffer{},
		lastMessage:  &bytes.Buffer{},
		ctx:          ctx.Context(),
		variables:    variables,
	}

	if wgParams.SubsribeOnce {
		flushWriter.subscribeOnce = true
		var cancellableCtx context.Context
		cancellableCtx, flushWriter.close = context.WithCancel(ctx.Context())
		ctx = ctx.WithContext(cancellableCtx)
	}

	return ctx, flushWriter, true
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
	// This detects all timeout errors, including context.DeadlineExceeded
	var ne net.Error
	if errors.As(err, &ne) && ne.Timeout() {
		// request timeout exceeded
		log.Error("request timeout exceeded",
			zap.String("operationName", operation.Name),
			zap.String("operationType", operation.OperationType.String()),
		)
		w.WriteHeader(http.StatusGatewayTimeout)
		return true
	}
	var validationError *inputvariables.ValidationError
	if errors.As(err, &validationError) {
		w.WriteHeader(http.StatusBadRequest)
		enc := json.NewEncoder(w)
		if err := enc.Encode(&validationError); err != nil {
			log.Error("error encoding validation error", zap.Error(err))
		}
		return true
	}
	log.Error(errorMessage,
		zap.String("operationName", operation.Name),
		zap.String("operationType", operation.OperationType.String()),
		zap.Error(err),
	)
	http.Error(w, fmt.Sprintf("%s: %s", errorMessage, err.Error()), http.StatusInternalServerError)
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

// cacheControlOverride performs the override of the Cache-Control header to mark
// responses to authenticated requests as private
func cacheControlOverride(r *http.Request, cc cacheheaders.CacheControl) cacheheaders.CacheControl {
	if authentication.UserFromContext(r.Context()) != nil || r.Header.Get("Authorization") != "" || r.Header.Get("Cookie") != "" {
		cc.Public = false
	}
	return cc
}

// newCacheControl creates a cacheheaders.CacheControl with the given operation
// cache configuration, applying the default values if config is nil
func newCacheControl(config *wgpb.OperationCacheConfig) *cacheheaders.CacheControl {
	const (
		defaultPublic               = true
		defaultMaxAge               = 0
		defaultStaleWhileRevalidate = -1
		defaultMustRevalidate       = true
	)
	if config == nil {
		// Return the default configuration
		return &cacheheaders.CacheControl{
			Public:               defaultPublic,
			MaxAge:               defaultMaxAge,
			StaleWhileRevalidate: defaultStaleWhileRevalidate,
			MustRevalidate:       defaultMustRevalidate,
			Override:             cacheControlOverride,
		}
	}
	if config.Enable != nil && !*config.Enable {
		// Explicitly disabled
		return nil
	}
	if config.MaxAge == nil && config.Public == nil && config.StaleWhileRevalidate == nil && config.MustRevalidate == nil {
		// No configuration values provided, disable
		return nil
	}
	// Some values where provided. Fill in the rest
	cc := &cacheheaders.CacheControl{
		Override: cacheControlOverride,
	}
	if config.Public != nil {
		cc.Public = *config.Public
	} else {
		cc.Public = defaultPublic
	}
	if config.MaxAge != nil {
		cc.MaxAge = *config.MaxAge
	} else {
		cc.MaxAge = defaultMaxAge
	}
	if config.StaleWhileRevalidate != nil {
		cc.StaleWhileRevalidate = *config.StaleWhileRevalidate
	} else {
		cc.StaleWhileRevalidate = defaultStaleWhileRevalidate
	}
	if config.MustRevalidate != nil {
		cc.MustRevalidate = *config.MustRevalidate
	} else {
		cc.MustRevalidate = defaultMustRevalidate
	}
	return cc
}
