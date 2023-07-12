package apihandler

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/buger/jsonparser"
	"github.com/dgraph-io/ristretto"
	"github.com/gorilla/mux"
	"github.com/hashicorp/go-multierror"
	"go.uber.org/zap"
	"golang.org/x/sync/singleflight"

	"github.com/wundergraph/graphql-go-tools/pkg/ast"
	"github.com/wundergraph/graphql-go-tools/pkg/astparser"
	"github.com/wundergraph/graphql-go-tools/pkg/astvalidation"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/plan"
	"github.com/wundergraph/graphql-go-tools/pkg/engine/resolve"
	"github.com/wundergraph/graphql-go-tools/pkg/graphql"
	"github.com/wundergraph/graphql-go-tools/pkg/operationreport"

	"github.com/wundergraph/wundergraph/internal/unsafebytes"
	"github.com/wundergraph/wundergraph/pkg/graphiql"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/operation"
	"github.com/wundergraph/wundergraph/pkg/pool"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type GraphQLHandlerOptions struct {
	// GraphQLBaseURL indicates the base URL used by the playground to query the GraphQL API.
	// The GraphQL endpoint is determined as {GraphQLBaseURL}/graphql
	GraphQLBaseURL  string
	Internal        bool
	PlanConfig      plan.Configuration
	Definition      *ast.Document
	Resolver        *resolve.Resolver
	RenameTypeNames []resolve.RenameTypeName
	Pool            *pool.Pool
	Cache           *ristretto.Cache
	Log             *zap.Logger
}

func mountGraphQLHandler(router *mux.Router, opts GraphQLHandlerOptions) {
	graphQLHandler := &GraphQLHandler{
		planConfig:      opts.PlanConfig,
		definition:      opts.Definition,
		resolver:        opts.Resolver,
		log:             opts.Log,
		pool:            opts.Pool,
		internal:        opts.Internal,
		sf:              &singleflight.Group{},
		prepared:        map[uint64]planWithExtractedVariables{},
		preparedMux:     &sync.RWMutex{},
		renameTypeNames: opts.RenameTypeNames,
		planCache:       opts.Cache,
	}
	apiPath := "/graphql"
	router.Methods(http.MethodPost, http.MethodOptions).Path(apiPath).Handler(graphQLHandler)
	opts.Log.Debug("registered GraphQLHandler",
		zap.Bool("internal", opts.Internal),
		zap.String("method", http.MethodPost),
		zap.String("path", apiPath),
	)

	graphqlPlaygroundHandler := &GraphQLPlaygroundHandler{
		log:     opts.Log,
		html:    graphiql.GetGraphiqlPlaygroundHTML(),
		nodeUrl: opts.GraphQLBaseURL,
	}
	router.Methods(http.MethodGet, http.MethodOptions).Path(apiPath).Handler(graphqlPlaygroundHandler)
	opts.Log.Debug("registered GraphQLPlaygroundHandler",
		zap.Bool("internal", opts.Internal),
		zap.String("method", http.MethodGet),
		zap.String("path", apiPath),
	)
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
	internal   bool

	prepared    map[uint64]planWithExtractedVariables
	preparedMux *sync.RWMutex

	renameTypeNames []resolve.RenameTypeName

	planCache *ristretto.Cache
}

func (h *GraphQLHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {

	var (
		preparedPlan planWithExtractedVariables
	)

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

	// clientRequest will only be provided in internal
	var clientRequest *http.Request
	if h.internal {
		req, err := NewRequestFromWunderGraphClientRequest(r.Context(), body)
		if err != nil {
			requestLogger.Error("GraphQLHandler.ServeHTTP: Could not create request from __wg.clientRequest",
				zap.Error(err),
				zap.String("url", r.RequestURI),
			)
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		clientRequest = req
	} else {
		clientRequest = r
	}

	shared := h.pool.GetSharedFromRequest(context.Background(), clientRequest, h.planConfig, pool.Config{
		RenameTypeNames: h.renameTypeNames,
	})
	defer h.pool.PutShared(shared)
	shared.Ctx.Variables = requestVariables
	shared.Doc.Input.ResetInputString(requestQuery)
	shared.Parser.Parse(shared.Doc, shared.Report)

	if shared.Report.HasErrors() {
		h.logInternalErrors(shared.Report, requestLogger)
		w.WriteHeader(http.StatusBadRequest)
		h.writeRequestErrors(shared.Report, w, requestLogger)
		return
	}

	if len(requestOperationName) == 0 {
		shared.Normalizer.NormalizeOperation(shared.Doc, h.definition, shared.Report)
	} else {
		shared.Normalizer.NormalizeNamedOperation(shared.Doc, h.definition, requestOperationName, shared.Report)
	}
	if shared.Report.HasErrors() {
		h.logInternalErrors(shared.Report, requestLogger)
		w.WriteHeader(http.StatusBadRequest)
		h.writeRequestErrors(shared.Report, w, requestLogger)
		return
	}

	opType := wgpb.OperationType_INVALID

	if len(shared.Doc.OperationDefinitions) > 0 {
		switch shared.Doc.OperationDefinitions[0].OperationType {
		case ast.OperationTypeQuery:
			opType = wgpb.OperationType_QUERY
		case ast.OperationTypeMutation:
			opType = wgpb.OperationType_MUTATION
		case ast.OperationTypeSubscription:
			opType = wgpb.OperationType_SUBSCRIPTION
		}
	}

	shared.Ctx = shared.Ctx.WithContext(operation.WithMetadata(shared.Ctx.Context(), &operation.Metadata{
		OperationType: opType,
	}))

	// create a hash of the query to use as a key for the prepared plan cache
	// in this hash, we include the printed operation
	// and the extracted variables (see below)
	err = shared.Printer.Print(shared.Doc, h.definition, shared.Hash)
	if err != nil {
		requestLogger.Error("print failed", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// add the extracted variables to the hash
	_, err = shared.Hash.Write(shared.Doc.Input.Variables)
	if err != nil {
		requestLogger.Error("hash write failed", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	operationID := shared.Hash.Sum64() // generate the operation ID
	shared.Hash.Reset()

	// try to get a prepared plan for this operation ID from the cache
	cachedPlan, ok := h.planCache.Get(operationID)
	if ok && cachedPlan != nil {
		// re-use a prepared plan
		preparedPlan = cachedPlan.(planWithExtractedVariables)
	} else {
		// prepare a new plan using single flight
		// this ensures that we only prepare the plan once for this operation ID
		sharedPreparedPlan, err, _ := h.sf.Do(strconv.FormatUint(operationID, 10), func() (interface{}, error) {
			prepared, err := h.preparePlan(requestOperationName, shared)
			if err != nil {
				return nil, err
			}
			// cache the prepared plan for 1 hour
			h.planCache.SetWithTTL(operationID, prepared, 1, time.Hour)
			return prepared, nil
		})
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			if shared.Report.HasErrors() {
				h.logInternalErrors(shared.Report, requestLogger)
				h.writeRequestErrors(shared.Report, w, requestLogger)
			} else {
				requestLogger.Error("prepare plan failed", zap.Error(err))
			}
			return
		}
		preparedPlan = sharedPreparedPlan.(planWithExtractedVariables)
	}

	if len(preparedPlan.variables) != 0 {
		shared.Ctx.Variables = MergeJsonRightIntoLeft(shared.Ctx.Variables, preparedPlan.variables)
	}

	switch p := preparedPlan.preparedPlan.(type) {
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
	// copy the extracted variables from the shared document
	// this is necessary because the shared document is reused across requests
	variables := make([]byte, len(shared.Doc.Input.Variables))
	copy(variables, shared.Doc.Input.Variables)

	// print the shared document into a buffer and re-parse it
	// this is necessary because the shared document will be re-used across requests
	// as the plan is cached, and will have references to the document, it cannot be re-used
	buf := &bytes.Buffer{}
	err := shared.Printer.Print(shared.Doc, h.definition, buf)
	if err != nil {
		return planWithExtractedVariables{}, fmt.Errorf(ErrMsgOperationParseFailed, err)
	}

	// parse the document again into a non-shared document, which will be used for planning
	// this will be cached, so it's insignificant that re-parsing causes overhead
	doc, report := astparser.ParseGraphqlDocumentBytes(buf.Bytes())
	if report.HasErrors() {
		return planWithExtractedVariables{}, fmt.Errorf(ErrMsgOperationParseFailed, err)
	}

	// validate the document before planning
	state := shared.Validation.Validate(&doc, h.definition, shared.Report)
	if state != astvalidation.Valid {
		return planWithExtractedVariables{}, errInvalid
	}

	// create and postprocess the plan
	preparedPlan := shared.Planner.Plan(&doc, h.definition, unsafebytes.BytesToString(requestOperationName), shared.Report)
	shared.Postprocess.Process(preparedPlan)

	return planWithExtractedVariables{
		preparedPlan: preparedPlan,
		variables:    variables,
	}, nil
}
