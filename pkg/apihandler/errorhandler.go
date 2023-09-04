package apihandler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"

	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/hooks"
	"github.com/wundergraph/wundergraph/pkg/inputvariables"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type errorHandler struct {
	operation *wgpb.Operation
	devMode   bool
}

func newErrorHandler(operation *wgpb.Operation, devMode bool) *errorHandler {
	return &errorHandler{
		operation: operation,
		devMode:   devMode,
	}
}

func (h *errorHandler) hookResponseError(w http.ResponseWriter, hookErr *hooks.HookResponseError) {
	type gqlError struct {
		Message string `json:"message"`
	}

	type gqlHookResponseErrorExtension struct {
		Code       string `json:"code,omitempty"`
		StatusCode int    `json:"statusCode,omitempty"`
		Stack      string `json:"stack,omitempty"`
	}
	type gqlErrorExtensions struct {
		Hooks []gqlHookResponseErrorExtension `json:"hooks"`
	}
	type gqlErrorResponse struct {
		Errors     []gqlError          `json:"errors"`
		Extensions *gqlErrorExtensions `json:"extensions,omitempty"`
	}
	// Only print stack traces on development mode
	stack := ""
	if h.devMode {
		stack = hookErr.Stack
	}
	resp := &gqlErrorResponse{
		Errors: []gqlError{
			{
				Message: hookErr.Message,
			},
		},
		Extensions: &gqlErrorExtensions{
			Hooks: []gqlHookResponseErrorExtension{
				{
					Code:       hookErr.Code,
					StatusCode: hookErr.StatusCode,
					Stack:      stack,
				},
			},
		},
	}
	data, err := json.Marshal(resp)
	if err != nil {
		http.Error(w, fmt.Sprintf("error encoding error response: %v", err), http.StatusInternalServerError)
		return
	}
	hdr := w.Header()
	hdr.Set("Content-Type", "application/json")
	hdr.Set("Content-Length", strconv.Itoa(len(data)))
	_, _ = w.Write(data)
}

func (h *errorHandler) Done(w http.ResponseWriter, err error, errorMessage string, log *zap.Logger) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, context.Canceled) {
		// client closed connection
		w.WriteHeader(499)
		return true
	}
	log = log.With(zap.String("operationName", h.operation.Name),
		zap.String("operationType", h.operation.OperationType.String()))
	// This detects all timeout errors, including context.DeadlineExceeded
	var ne net.Error
	if errors.As(err, &ne) && ne.Timeout() {
		// request timeout exceeded
		log.Warn("request timeout exceeded")
		w.WriteHeader(http.StatusGatewayTimeout)
		_, _ = io.WriteString(w, http.StatusText(http.StatusGatewayTimeout))
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
	var hookResponseError *hooks.HookResponseError
	if errors.As(err, &hookResponseError) && hookResponseError.Message != "" {
		h.hookResponseError(w, hookResponseError)
		return true
	}
	log.Error(errorMessage, zap.Error(err))
	http.Error(w, fmt.Sprintf("%s: %s", errorMessage, err.Error()), http.StatusInternalServerError)
	return true
}
