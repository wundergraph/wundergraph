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

type jsonError struct {
	Message string `json:"message"`
}

func (e *jsonError) Error() string {
	return e.Message
}

type ValidationError struct {
	Message string
	Input   json.RawMessage
	Errors  []error
}

func (v *Validator) Validate(ctx context.Context, variables []byte, errOut io.Writer) (valid bool, err error) {
	errs, err := v.schema.ValidateBytes(ctx, variables)
	if err == nil && len(errs) == 0 {
		return true, nil
	}
	if v.disableVerboseErrors {
		if _, err := io.WriteString(errOut, "Bad Request: Invalid input"); err != nil {
			return false, err
		}
	} else {
		var input []byte
		var validationErrors []error
		if err != nil {
			// if err is non nil, JSON might be invalid and we cannot
			// send it back to the client as json.RawMessage because it
			// will fail to serialize
			validationErrors = append(validationErrors, &jsonError{Message: err.Error()})
		} else {
			input = variables
			for _, err := range errs {
				validationErrors = append(validationErrors, err)
			}
		}
		validationError := ValidationError{
			Message: "Bad Request: Invalid input",
			Input:   input,
			Errors:  validationErrors,
		}
		if err := json.NewEncoder(errOut).Encode(validationError); err != nil {
			return false, err
		}
	}
	return false, nil
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
