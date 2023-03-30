package inputvariables

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"

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
	// Run validator once to make it set up its internal state, otherwise we
	// run into a data race in https://github.com/qri-io/jsonschema/blob/master/schema.go#L60
	validator.schema.Validate(context.Background(), []byte{})
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

func NewValidationError(message string, input json.RawMessage, errors []error) *ValidationError {
	return &ValidationError{Code: "InputValidationError", Message: message, Input: input, Errors: errors}
}

type ValidationError struct {
	Code    string          `json:"code,omitempty"`
	Message string          `json:"message,omitempty"`
	Input   json.RawMessage `json:"input,omitempty"`
	Errors  []error         `json:"errors,omitempty"`
}

func (e *ValidationError) Error() string {
	return e.Message
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
			//
			// Unwrap the error to include the offset in the input, since json.SyntaxError.Error()
			// doesn't include it
			var syntaxErr *json.SyntaxError
			if errors.As(err, &syntaxErr) {
				err = fmt.Errorf("invalid JSON at offset %v: %w", syntaxErr.Offset, syntaxErr)
			}
			validationErrors = append(validationErrors, &jsonError{Message: err.Error()})
		} else {
			input = variables
			for _, v := range errs {
				validationErrors = append(validationErrors, v)
			}
		}
		validationError := NewValidationError("Bad Request: Invalid input", input, validationErrors)
		if err := json.NewEncoder(errOut).Encode(validationError); err != nil {
			return false, err
		}
	}
	return false, nil
}
