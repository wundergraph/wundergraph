// Package httperror implements functions for returning HTTP errors to clients
package httperror

import (
	"context"
	"errors"
	"net/http"
	"os"

	"github.com/wundergraph/wundergraph/pkg/cachecontrol"
)

// Error is a wrapper over http.Error which also sets the appropriate response headers
func Error(w http.ResponseWriter, error string, code int) {
	cachecontrol.Disabled().Set(w)
	http.Error(w, error, code)
}

// Err determines the appropiate HTTP status code depending on err and if message
// is empty, replaces it with the default message for the HTTP code
func Err(w http.ResponseWriter, err error, message string) {
	code := http.StatusInternalServerError
	if errors.Is(err, context.DeadlineExceeded) || os.IsTimeout(err) {
		code = http.StatusGatewayTimeout
	}
	if message == "" {
		message = http.StatusText(code)
	}
	Error(w, message, code)
}
