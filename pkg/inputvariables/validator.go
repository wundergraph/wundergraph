package inputvariables

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/qri-io/jsonschema"
)

type Validator struct {
	schema          jsonschema.Schema
	schemaString    string
	enableDebugMode bool
}

func NewValidator(schema string, enableDebugMode bool) (*Validator, error) {
	var validator Validator
	err := json.Unmarshal([]byte(schema), &validator.schema)
	if err != nil {
		return nil, err
	}
	validator.schemaString = schema
	validator.enableDebugMode = enableDebugMode
	return &validator, nil
}

func (v *Validator) Validate(ctx context.Context, variables []byte) bool {
	errs, err := v.schema.ValidateBytes(ctx, variables)
	valid := err == nil && len(errs) == 0
	if !valid && v.enableDebugMode {
		errDump, _ := json.Marshal(errs)
		fmt.Printf("\n\nVariable Validation: invalid\n\nJSON Schema:\n\n%s\n\nVariables:\n\n%s\n\nErrors:\n\n%s\n\n", v.schemaString, string(variables), string(errDump))
	}
	return valid
}
