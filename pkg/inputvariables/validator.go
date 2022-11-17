package inputvariables

import (
	"context"
	"encoding/json"
	"io"
	"net/http"

	"github.com/qri-io/jsonschema"
)

type Validator struct {
	schema               jsonschema.Schema
	schemaString         string
	disableVerboseErrors bool
}

func NewValidator(schema string, disableVerboseErrors bool) (*Validator, error) {
	var validator Validator
	err := json.Unmarshal([]byte(schema), &validator.schema)
	if err != nil {
		return nil, err
	}
	validator.schemaString = schema
	validator.disableVerboseErrors = disableVerboseErrors
	return &validator, nil
}

type ValidationError struct {
	Message string
	Input   json.RawMessage
	Errors  []jsonschema.KeyError
}

func (v *Validator) Validate(ctx context.Context, variables []byte, errOut io.Writer) (valid bool) {
	errs, err := v.schema.ValidateBytes(ctx, variables)
	if err == nil && len(errs) == 0 {
		return true
	}
	if v.disableVerboseErrors {
		_, _ = io.WriteString(errOut, "Bad Request: Invalid input")
	} else {
		validationError := ValidationError{
			Message: "Bad Request: Invalid input",
			Input:   variables,
			Errors:  errs,
		}
		_ = json.NewEncoder(errOut).Encode(validationError)
	}
	return false
}

func NewValidationWriter(w http.ResponseWriter) *ValidationWriter {
	return &ValidationWriter{w: w}
}

type ValidationWriter struct {
	w              http.ResponseWriter
	didWriteHeader bool
}

func (v *ValidationWriter) Write(p []byte) (n int, err error) {
	if !v.didWriteHeader {
		v.w.WriteHeader(http.StatusBadRequest)
		v.didWriteHeader = true
	}
	return v.w.Write(p)
}
