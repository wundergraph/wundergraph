package apihandler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/buger/jsonparser"
	"github.com/dgraph-io/ristretto"
	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"github.com/hashicorp/go-uuid"
	"github.com/tidwall/gjson"
	"github.com/tidwall/sjson"
	"github.com/wI2L/jsondiff"
	"go.uber.org/zap"

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

	"github.com/wundergraph/wundergraph/internal/unsafebytes"
	"github.com/wundergraph/wundergraph/pkg/authentication"
	"github.com/wundergraph/wundergraph/pkg/cacheheaders"
	"github.com/wundergraph/wundergraph/pkg/engineconfigloader"
	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/inputvariables"
	"github.com/wundergraph/wundergraph/pkg/interpolate"
	"github.com/wundergraph/wundergraph/pkg/jsonpath"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/metrics"
	"github.com/wundergraph/wundergraph/pkg/operation"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/postresolvetransform"
	"github.com/wundergraph/wundergraph/pkg/querystring"
	"github.com/wundergraph/wundergraph/pkg/s3uploadclient"
	"github.com/wundergraph/wundergraph/pkg/trace"
	"github.com/wundergraph/wundergraph/pkg/webhookhandler"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const (
	WgInternalApiCallHeader = "X-WG-Internal-GraphQL-API"

	WgPrefix             = "wg_"
	WgVariables          = WgPrefix + "variables"
	WgLiveParam          = WgPrefix + "live"
	WgJSONPatchParam     = WgPrefix + "json_patch"
	WgSSEParam           = WgPrefix + "sse"
	WgSubscribeOnceParam = WgPrefix + "subscribe_once"
	WgDeduplicateParam   = WgPrefix + "deduplicate"

	defaultAuthTimeoutSeconds = 600 // 10 minutes
)

type JSONPatchConfiguration int

const (
	JSONPatchConfigurationDisabled = JSONPatchConfiguration(0)
	JSONPatchConfigurationEnabled  = JSONPatchConfiguration(1)
	JSONPatchConfigurationForced   = JSONPatchConfiguration(2)
)

func (c JSONPatchConfiguration) IsEnabled() bool {
	return c > JSONPatchConfigurationDisabled
}

type WgRequestParams struct {
	JSONPatch     JSONPatchConfiguration
	SSE           bool
	SubscribeOnce bool
	Deduplicate   bool
}

func NewWgRequestParams(r *http.Request) WgRequestParams {
	q := r.URL.Query()
	var JSONPatch JSONPatchConfiguration
	if q.Has(WgJSONPatchParam) {
		if q.Get(WgJSONPatchParam) == "force" {
			JSONPatch = JSONPatchConfigurationForced
		} else {
			JSONPatch = JSONPatchConfigurationForced
		}
	}
	return WgRequestParams{
		JSONPatch:     JSONPatch,
		SSE:           q.Has(WgSSEParam),
		SubscribeOnce: q.Has(WgSubscribeOnceParam),
		Deduplicate:   q.Has(WgDeduplicateParam),
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

	insecureCookies     bool
	forceHttpsRedirects bool
	enableIntrospection bool
	devMode             bool

	renameTypeNames []resolve.RenameTypeName

	githubAuthDemoClientID     string
	githubAuthDemoClientSecret string

	metrics metrics.Metrics
}

type BuilderConfig struct {
	InsecureCookies            bool
	ForceHttpsRedirects        bool
	EnableRequestLogging       bool
	EnableIntrospection        bool
	GitHubAuthDemoClientID     string
	GitHubAuthDemoClientSecret string
	DevMode                    bool
	Metrics                    metrics.Metrics
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
		enableIntrospection:        config.EnableIntrospection,
		githubAuthDemoClientID:     config.GitHubAuthDemoClientID,
		githubAuthDemoClientSecret: config.GitHubAuthDemoClientSecret,
		devMode:                    config.DevMode,
		metrics:                    config.Metrics,
	}
}

func (r *Builder) BuildAndMountApiHandler(ctx context.Context, router *mux.Router, api *Api, planCache *ristretto.Cache) (streamClosers []chan struct{}, err error) {
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

	planConfig, err := r.loader.Load(api.EngineConfiguration, api.Options.ServerUrl)
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

	r.log.Debug("configuring API",
		zap.Int("numOfOperations", len(api.Operations)),
	)

	r.router.Use(func(handler http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
			requestID := request.Header.Get(logging.RequestIDHeader)
			if requestID == "" {
				id, _ := uuid.GenerateUUID()
				requestID = id
			}

			request = request.WithContext(context.WithValue(request.Context(), logging.RequestIDKey{}, requestID))

			if len(api.Hosts) > 0 {
				for i := range api.Hosts {
					if request.Host == api.Hosts[i] {
						handler.ServeHTTP(w, request)
						return
					}
				}
				http.Error(w, fmt.Sprintf("Host not found: %s", request.Host), http.StatusNotFound)
				return
			}

			handler.ServeHTTP(w, request)
		})
	})

	if err := r.registerAuth(); err != nil {
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
		mountGraphQLHandler(r.router, GraphQLHandlerOptions{
			GraphQLBaseURL:  api.Options.PublicNodeUrl,
			Internal:        false,
			PlanConfig:      r.planConfig,
			Definition:      r.definition,
			Resolver:        r.resolver,
			RenameTypeNames: r.renameTypeNames,
			Pool:            r.pool,
			Cache:           planCache,
			Log:             r.log,
		})
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

	var operationHandler http.Handler
	var route *mux.Route

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
		hooksPipeline := hooks.NewSynchronousOperationPipeline(hooksPipelineConfig)
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
			errorHandler:           newErrorHandler(operation, r.devMode),
		}

		if operation.LiveQueryConfig != nil && operation.LiveQueryConfig.Enable {
			handler.liveQuery = liveQueryConfig{
				enabled:                true,
				pollingIntervalSeconds: operation.LiveQueryConfig.PollingIntervalSeconds,
			}
		}

		copy(handler.extractedVariables, shared.Doc.Input.Variables)

		route = r.router.Methods(http.MethodGet, http.MethodOptions).Path(apiPath)
		operationHandler = handler

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
		hooksPipeline := hooks.NewSynchronousOperationPipeline(hooksPipelineConfig)
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
			errorHandler:           newErrorHandler(operation, r.devMode),
		}
		copy(handler.extractedVariables, shared.Doc.Input.Variables)
		route = r.router.Methods(http.MethodPost, http.MethodOptions).Path(apiPath)
		operationHandler = handler

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
			pingInterval:           r.api.Options.Subscriptions.ServerPingInterval,
			errorHandler:           newErrorHandler(operation, r.devMode),
		}
		copy(handler.extractedVariables, shared.Doc.Input.Variables)
		route = r.router.Methods(http.MethodGet, http.MethodOptions).Path(apiPath)
		operationHandler = handler

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

	if route != nil && operationHandler != nil {

		if operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired {
			operationHandler = authentication.RequiresAuthentication(operationHandler)
			route.Handler(authentication.RequiresAuthentication(operationHandler))
		}
		metrics := newOperationMetrics(r.metrics, operation.Name)
		route.Handler(metrics.Handler(operationHandler))
	} else {
		r.registerInvalidOperation(operation.Name)
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

type planWithExtractedVariables struct {
	preparedPlan plan.Plan
	variables    []byte
}

var (
	errInvalid = errors.New("invalid")
)

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

type GraphQLResolver interface {
	QueryResolver
	SubscriptionResolver
}

type liveQueryConfig struct {
	enabled                bool
	pollingIntervalSeconds int64
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
	errorHandler           *errorHandler
}

func (h *QueryHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	requestLogger := h.log.With(logging.WithRequestIDFromContext(r.Context()))
	r = operation.RequestWithMetadata(r, operation.NewMetadata(h.operation))

	// Set trace attributes based on the current operation
	trace.SetOperationAttributes(r.Context())

	if proceed := h.rbacEnforcer.Enforce(r); !proceed {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	isLive := h.liveQuery.enabled && r.URL.Query().Has(WgLiveParam)

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	resolveCtx := pool.GetCtx(r, r, pool.Config{
		RenameTypeNames: h.renameTypeNames,
	})
	defer pool.PutCtx(resolveCtx)

	var err error
	resolveCtx.Variables, err = querystring.ToJSON(r.URL.RawQuery, h.queryParamsAllowList)
	if err != nil {
		requestLogger.Error("Could not parse query string", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	resolveCtx.Variables = h.stringInterpolator.Interpolate(resolveCtx.Variables)

	if !validateInputVariables(resolveCtx.Context(), requestLogger, resolveCtx.Variables, h.variablesValidator, w) {
		return
	}

	compactBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(compactBuf)
	err = json.Compact(compactBuf, resolveCtx.Variables)
	if err != nil {
		requestLogger.Error("Could not compact variables in query handler", zap.Bool("isLive", isLive), zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	resolveCtx.Variables = compactBuf.Bytes()

	resolveCtx.Variables = h.jsonStringInterpolator.Interpolate(resolveCtx.Variables)

	if len(h.extractedVariables) != 0 {
		// we make a copy of the extracted variables to not override h.extractedVariables
		resolveCtx.Variables = MergeJsonRightIntoLeft(h.extractedVariables, resolveCtx.Variables)
	}

	resolveCtx.Variables, err = postProcessVariables(h.operation, r, resolveCtx.Variables)
	if h.errorHandler.Done(w, err, "postProcessVariables failed", requestLogger) {
		return
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
		h.handleLiveQuery(r, w, resolveCtx, buf, flusher, requestLogger)
		return
	}

	resp, err := h.hooksPipeline.Run(resolveCtx, w, r, buf)
	if h.errorHandler.Done(w, err, "hooks pipeline failed", requestLogger) {
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
	if h.errorHandler.Done(w, err, "writing response failed", requestLogger) {
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

	if wgParams.SSE {
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
			if wgParams.SSE {
				_, _ = w.Write([]byte("data: "))
			}
			if wgParams.SubscribeOnce {
				flusher.Flush()
				return
			}
			if wgParams.JSONPatch.IsEnabled() && lastData.Len() != 0 {
				last := lastData.Bytes()
				current := currentData.Bytes()
				patch, err := jsondiff.CompareJSON(last, current)
				if err != nil {
					requestLogger.Error("could not create json patch", zap.Error(err))
					continue
				}
				patchBytes, err := json.Marshal(patch)
				if err != nil {
					requestLogger.Error("could not marshal json patch", zap.Error(err))
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
	errorHandler           *errorHandler
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
	r = operation.RequestWithMetadata(r, operation.NewMetadata(h.operation))

	// Set trace attributes based on the current operation
	trace.SetOperationAttributes(r.Context())

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
	if h.errorHandler.Done(w, err, "postProcessVariables failed", requestLogger) {
		return
	}

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	resp, err := h.hooksPipeline.Run(ctx, w, r, buf)
	if h.errorHandler.Done(w, err, "hooks pipeline failed", requestLogger) {
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
	if h.errorHandler.Done(w, err, "writing response failed", requestLogger) {
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
	pingInterval           time.Duration
	errorHandler           *errorHandler
}

func (h *SubscriptionHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	requestLogger := h.log.With(logging.WithRequestIDFromContext(r.Context()))
	r = operation.RequestWithMetadata(r, operation.NewMetadata(h.operation))

	// Set trace attributes based on the current operation
	trace.SetOperationAttributes(r.Context())

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

	var err error
	ctx.Variables, err = querystring.ToJSON(r.URL.RawQuery, h.queryParamsAllowList)
	if err != nil {
		requestLogger.Error("Could not parse query string", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	ctx.Variables = h.stringInterpolator.Interpolate(ctx.Variables)

	if !validateInputVariables(ctx.Context(), requestLogger, ctx.Variables, h.variablesValidator, w) {
		return
	}

	compactBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(compactBuf)
	err = json.Compact(compactBuf, ctx.Variables)
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
	if h.errorHandler.Done(w, err, "postProcessVariables failed", requestLogger) {
		return
	}

	ctx, flushWriter, ok := getHooksFlushWriter(ctx, r, w, h.hooksPipeline, h.log)
	if !ok {
		http.Error(w, "Connection not flushable", http.StatusBadRequest)
		return
	}

	flushWriter.StartPinging(h.pingInterval)
	defer flushWriter.Close()

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

type httpFlushWriterOutput struct {
	// The mutex guards both the writer and flusher
	mu      sync.Mutex
	writer  http.ResponseWriter
	flusher http.Flusher
}

func (o *httpFlushWriterOutput) WriteFlushing(data []byte) (int, error) {
	o.mu.Lock()
	defer o.mu.Unlock()
	var n int
	var err error
	if data != nil {
		n, err = o.writer.Write(data)
	}
	o.flusher.Flush()
	return n, err
}

type httpFlushWriterPing struct {
	interval time.Duration
	ticker   *time.Ticker
	notify   chan struct{}
}

func (p *httpFlushWriterPing) Close() {
	if p != nil {
		close(p.notify)
		p.ticker.Stop()
	}
}

type httpFlushWriter struct {
	ctx                    context.Context
	output                 httpFlushWriterOutput
	postResolveTransformer *postresolvetransform.Transformer
	subscribeOnce          bool
	sse                    bool
	jsonPatch              JSONPatchConfiguration
	deduplicate            bool
	close                  func()
	buf                    bytes.Buffer
	lastMessage            bytes.Buffer
	ping                   *httpFlushWriterPing
	// Used for hooks
	resolveContext *resolve.Context
	request        *http.Request
	hooksPipeline  *hooks.SubscriptionOperationPipeline
	logger         *zap.Logger
}

func newHTTPFlushWriter(ctx context.Context, w http.ResponseWriter, flusher http.Flusher, params WgRequestParams) *httpFlushWriter {
	return &httpFlushWriter{
		ctx: ctx,
		output: httpFlushWriterOutput{
			writer:  w,
			flusher: flusher,
		},
		sse:         params.SSE,
		jsonPatch:   params.JSONPatch,
		deduplicate: params.Deduplicate,
	}
}

// StartPinging starts pinging the client at the given interval. Any write resets
// the ping timer. If interval is <= 0, this is a no-op.
func (f *httpFlushWriter) StartPinging(interval time.Duration) {
	if interval <= 0 {
		return
	}
	f.ping = &httpFlushWriterPing{
		interval: interval,
		ticker:   time.NewTicker(interval),
		notify:   make(chan struct{}, 1),
	}
	go func() {
		for {
			select {
			case <-f.ping.ticker.C:
				f.output.WriteFlushing([]byte{'\n'})
			case <-f.ctx.Done():
				return
			case <-f.ping.notify:
				f.ping.ticker.Reset(f.ping.interval)
				continue
			}
		}
	}()
}

func (f *httpFlushWriter) resetPingTimer() {
	if f.ping != nil {
		select {
		case f.ping.notify <- struct{}{}:
		default:
		}
	}
}

// Deduplicate enables or disables deduplication (off by default). When deduplication
// is enabled multiple messages with the same payload cause the second and subsequent
// ones to be omitted. This is typically used by live queries.
func (f *httpFlushWriter) Deduplicate(dedup bool) {
	f.deduplicate = dedup
}

func (f *httpFlushWriter) Header() http.Header {
	return f.output.writer.Header()
}

func (f *httpFlushWriter) WriteHeader(statusCode int) {
	f.output.mu.Lock()
	defer f.output.mu.Unlock()
	f.output.writer.WriteHeader(statusCode)
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
	f.ping.Close()
	if f.sse {
		f.output.WriteFlushing([]byte("event: done\n\n"))
	}
}

func (f *httpFlushWriter) writeChunk(data []byte) error {
	f.output.mu.Lock()
	defer f.output.mu.Unlock()
	if f.sse {
		if _, err := f.output.writer.Write([]byte("data: ")); err != nil {
			return err
		}
	}

	if _, err := f.output.writer.Write(data); err != nil {
		return err
	}
	f.resetPingTimer()
	return nil
}

func (f *httpFlushWriter) runPostResolveHook(resp []byte) ([]byte, error) {
	if f.hooksPipeline != nil {
		postResolveResponse, err := f.hooksPipeline.PostResolve(f.resolveContext, nil, f.request, resp)
		if err != nil {
			if f.logger != nil {
				f.logger.Error("subscription postResolve hooks", zap.Error(err))
			}
			return nil, err
		}
		return postResolveResponse.Data, nil
	}
	return resp, nil
}

var errNoJSONPatch = errors.New("not using JSON patch")

func (f *httpFlushWriter) prepareJSONPatch(resp []byte) ([]byte, error) {
	if f.jsonPatch.IsEnabled() && f.lastMessage.Len() != 0 {
		last := f.lastMessage.Bytes()
		patch, err := jsondiff.CompareJSON(last, resp)
		if err != nil {
			return nil, fmt.Errorf("creating JSON patch: %w", err)
		}
		if len(patch) == 0 {
			// no changes
			return nil, errNoJSONPatch
		}
		patchData, err := json.Marshal(patch)
		if err != nil {
			return nil, fmt.Errorf("serializing JSON patch: %w", err)
		}
		if len(patchData) >= len(resp) && f.jsonPatch != JSONPatchConfigurationForced {
			// patch is bigger than the payload, use the payload instead unless forced
			return nil, errNoJSONPatch
		}
		return patchData, nil
	}
	return nil, errNoJSONPatch
}

func (f *httpFlushWriter) Flush() {
	resp := f.buf.Bytes()
	f.buf.Reset()

	resp, err := f.runPostResolveHook(resp)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			return
		}
	}

	patchData, err := f.prepareJSONPatch(resp)
	if err != nil && err != errNoJSONPatch {
		if f.logger != nil {
			f.logger.Error("generating JSON patch", zap.Error(err))
		}
	}

	responseData := patchData
	if responseData == nil {
		responseData = resp
	}

	if f.deduplicate && bytes.Equal(f.lastMessage.Bytes(), resp) {
		return
	}

	if err := f.writeChunk(responseData); err != nil {
		if f.logger != nil {
			f.logger.Error("writing data", zap.Error(err))
		}
	}

	f.lastMessage.Reset()
	_, _ = f.lastMessage.Write(resp)

	if f.subscribeOnce {
		f.output.WriteFlushing(nil)
		f.close()
		return
	}
	if _, err := f.output.WriteFlushing([]byte("\n\n")); err != nil {
		if f.logger != nil {
			f.logger.Error("writing separator", zap.Error(err))
		}
	}
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
	return authenticationHooks(r.api, r.middlewareClient, r.log)
}

func (r *Builder) registerAuth() error {

	config, err := loadUserConfiguration(r.api, r.middlewareClient, r.insecureCookies, r.log)
	if err != nil {
		return err
	}

	r.router.Use(authentication.NewLoadUserMw(config))
	r.router.Use(authentication.NewCSRFMw(authentication.CSRFConfig{
		InsecureCookies: r.insecureCookies,
		Secret:          config.CSRFSecret,
	}))

	userHandler := &authentication.UserHandler{
		Hooks:           config.Hooks,
		Log:             r.log,
		InsecureCookies: r.insecureCookies,
		Cookie:          config.Cookie,
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

	return r.registerCookieAuthHandlers(cookieBasedAuth, config.Cookie, config.Hooks)
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

	timeoutSeconds, err := loadvariable.Int(r.api.AuthenticationConfig.GetCookieBased().GetTimeoutSeconds())
	if err != nil {
		return err
	}

	if timeoutSeconds <= 0 {
		timeoutSeconds = defaultAuthTimeoutSeconds
	}

	authTimeout := time.Second * time.Duration(timeoutSeconds)

	for _, provider := range r.api.AuthenticationConfig.CookieBased.Providers {
		r.configureCookieProvider(router, provider, cookie, authTimeout)
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
		clientSecret := loadvariable.String(provider.OidcConfig.ClientSecret)

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

func (r *Builder) configureCookieProvider(router *mux.Router, provider *wgpb.AuthProvider, cookie *securecookie.SecureCookie, authTimeout time.Duration) {

	authorizedRedirectUris := loadvariable.Strings(r.api.AuthenticationConfig.CookieBased.AuthorizedRedirectUris)
	authorizedRedirectUriRegexes := loadvariable.Strings(r.api.AuthenticationConfig.CookieBased.AuthorizedRedirectUriRegexes)

	defaultRedirectProtocol := "http"
	containsHttps := func(uris []string) bool {
		for _, value := range uris {
			if strings.HasPrefix(strings.ToLower((value)), "https://") {
				return true
			}
		}
		return false
	}
	if containsHttps(authorizedRedirectUris) || containsHttps(authorizedRedirectUriRegexes) {
		defaultRedirectProtocol = "https"
	}

	router.Use(authentication.RedirectAlreadyAuthenticatedUsers(authorizedRedirectUris, authorizedRedirectUriRegexes))
	authorizeRouter := router.PathPrefix("/" + authentication.AuthorizePath).Subrouter()
	authorizeRouter.Use(authentication.ValidateRedirectURIQueryParameter(authorizedRedirectUris, authorizedRedirectUriRegexes))

	callbackRouter := router.PathPrefix("/" + authentication.CallbackPath).Subrouter()

	providerConfig := authentication.ProviderConfig{
		ID:                      provider.Id,
		InsecureCookies:         r.insecureCookies,
		ForceRedirectHttps:      r.forceHttpsRedirects,
		Cookie:                  cookie,
		AuthTimeout:             authTimeout,
		DefaultRedirectProtocol: defaultRedirectProtocol,
	}

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
		github := authentication.NewGithubCookieHandler(authentication.GithubConfig{
			Provider:     providerConfig,
			ClientID:     loadvariable.String(provider.GithubConfig.ClientId),
			ClientSecret: loadvariable.String(provider.GithubConfig.ClientSecret),
		}, r.authenticationHooks(), r.log)
		github.Register(authorizeRouter, callbackRouter)
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

		openID, err := authentication.NewOpenIDConnectCookieHandler(authentication.OpenIDConnectConfig{
			Provider:        providerConfig,
			Issuer:          loadvariable.String(provider.OidcConfig.Issuer),
			ClientID:        loadvariable.String(provider.OidcConfig.ClientId),
			ClientSecret:    loadvariable.String(provider.OidcConfig.ClientSecret),
			QueryParameters: queryParameters,
		}, r.authenticationHooks(), r.log)
		if err != nil {
			r.log.Error("creating OIDC auth provider", zap.Error(err))
			break
		}
		openID.Register(authorizeRouter, callbackRouter)
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

	var handler http.Handler = &FunctionsHandler{
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
		internal:     false,
		pingInterval: r.api.Options.Subscriptions.ServerPingInterval,
		errorHandler: newErrorHandler(operation, r.devMode),
	}

	if operation.AuthenticationConfig != nil && operation.AuthenticationConfig.AuthRequired {
		handler = authentication.RequiresAuthentication(handler)
	}

	metrics := newOperationMetrics(r.metrics, operation.Name)
	route.Handler(metrics.Handler(handler))

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
	pingInterval         time.Duration
	errorHandler         *errorHandler
}

func (h *FunctionsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	reqID := r.Header.Get(logging.RequestIDHeader)
	requestLogger := h.log.With(logging.WithRequestID(reqID))
	r = r.WithContext(context.WithValue(r.Context(), logging.RequestIDKey{}, reqID))
	r = operation.RequestWithMetadata(r, operation.NewMetadata(h.operation))

	// Set trace attributes based on the current operation
	trace.SetOperationAttributes(r.Context())

	if proceed := h.rbacEnforcer.Enforce(r); !proceed {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	clientRequest := r
	if h.internal {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			requestLogger.Error("reading body", zap.Error(err))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}
		// We need to restore the body, since we might call r.ParseForm() later
		r.Body = io.NopCloser(bytes.NewReader(body))
		clientRequest, err = NewRequestFromWunderGraphClientRequest(r.Context(), body)
		if err != nil {
			requestLogger.Error("InternalApiHandler.ServeHTTP: Could not create request from __wg.clientRequest",
				zap.Error(err),
				zap.String("url", r.RequestURI),
			)
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
	}

	ctx := pool.GetCtx(r, clientRequest, pool.Config{})
	defer pool.PutCtx(ctx)

	variablesBuf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(variablesBuf)

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	ct := r.Header.Get("Content-Type")
	if r.Method == http.MethodGet {
		var err error
		ctx.Variables, err = querystring.ToJSON(r.URL.RawQuery, h.queryParamsAllowList)
		if err != nil {
			requestLogger.Error("Could not parse query string", zap.Error(err))
			w.WriteHeader(http.StatusBadRequest)
			return
		}
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
	if h.errorHandler.Done(w, err, "encoding hook data failed", requestLogger) {
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

	resolveCtx, fw, ok = getFlushWriter(resolveCtx, r, w)
	if !ok {
		requestLogger.Error("request doesn't support flushing")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	fw.Deduplicate(true)

	buf := pool.GetBytesBuffer()
	defer pool.PutBytesBuffer(buf)

	var (
		lastResponse bytes.Buffer
	)

	defer fw.Close()

	ctx := resolveCtx.Context()

	timer := time.NewTimer(0)
	defer timer.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-timer.C:
			timer.Reset(time.Duration(time.Duration(h.liveQuery.pollingIntervalSeconds) * time.Second))
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
	resolveCtx, flushWriter, ok := getFlushWriter(resolveCtx, r, w)
	if !ok {
		requestLogger.Error("could not retrieve flush writer")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	ctx := resolveCtx.Context()
	flushWriter.StartPinging(h.pingInterval)
	defer flushWriter.Close()
	err := h.hooksClient.DoFunctionSubscriptionRequest(ctx, h.operation.Path, input, wgParams.SubscribeOnce, flushWriter, buf)
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
	ctx, flushWriter, ok = getFlushWriter(ctx, r, w)
	if !ok {
		return nil, nil, false
	}

	flushWriter.resolveContext = ctx
	flushWriter.request = r
	flushWriter.hooksPipeline = pipeline
	flushWriter.logger = logger
	return ctx, flushWriter, true
}

func getFlushWriter(ctx *resolve.Context, r *http.Request, w http.ResponseWriter) (*resolve.Context, *httpFlushWriter, bool) {
	wgParams := NewWgRequestParams(r)

	flusher, ok := w.(http.Flusher)
	if !ok {
		return ctx, nil, false
	}

	if !wgParams.SubscribeOnce {
		setSubscriptionHeaders(w)
	}

	flushWriter := newHTTPFlushWriter(ctx.Context(), w, flusher, wgParams)

	if wgParams.SubscribeOnce {
		flushWriter.subscribeOnce = true
		var cancellableCtx context.Context
		cancellableCtx, flushWriter.close = context.WithCancel(ctx.Context())
		ctx = ctx.WithContext(cancellableCtx)
	}

	return ctx, flushWriter, true
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
