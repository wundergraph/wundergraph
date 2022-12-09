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
	validator.schemaString = schema
	validator.disableVerboseErrors = disableVerboseErrors
	return &validator, nil
}

type jsonError struct {
	Message string `json:"Message"`
}

func (e *jsonError) Error() string {
	return e.Message
}

// mirrored from jsonschema.KeyError to provide a slightly different JSON serialization
type keyError struct {
	PropertyPath string      `json:"PropertyPath,omitempty"`
	InvalidValue interface{} `json:"InvalidValue,omitempty"`
	Message      string      `json:"Message"`
}

func (v keyError) Error() string {
	if v.PropertyPath != "" && v.InvalidValue != nil {
		return fmt.Sprintf("%s: %s %s", v.PropertyPath, jsonschema.InvalidValueString(v.InvalidValue), v.Message)
	} else if v.PropertyPath != "" {
		return fmt.Sprintf("%s: %s", v.PropertyPath, v.Message)
	}
	return v.Message
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
				validationErrors = append(validationErrors, &keyError{
					PropertyPath: v.PropertyPath,
					InvalidValue: v.InvalidValue,
					Message:      v.Message,
				})
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
