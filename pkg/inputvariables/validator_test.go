package inputvariables

import (
	"bytes"
	"context"
	"io"
	"testing"

	"github.com/stretchr/testify/assert"
)

const (
	validEmptySchema = `{"type":"object","properties":{},"additionalProperties":false}`
	validSchema      = `{"type":"object","properties":{"id":{"type":"string"}},"additionalProperties":false,"required":["id"]}`
	brokenSchema     = `{"type":"object","properties":{"id":{"type":"foo"}},"additionalProperties":false,"required":["id"]}`
)

func TestValidator_Validate(t *testing.T) {
	validator, err := NewValidator(validEmptySchema, true)
	assert.NoError(t, err)

	actual, err := validator.Validate(context.Background(), []byte(`{}`), io.Discard)
	assert.Nil(t, err)
	assert.Equal(t, true, actual)

	actual, err = validator.Validate(context.Background(), []byte(``), io.Discard)
	assert.Nil(t, err)
	assert.Equal(t, false, actual)

	actual, err = validator.Validate(context.Background(), []byte(`{"foo":"bar"}`), io.Discard)
	assert.Nil(t, err)
	assert.Equal(t, false, actual)

	validator, err = NewValidator(validSchema, true)
	assert.NoError(t, err)

	out := &bytes.Buffer{}
	actual, err = validator.Validate(context.Background(), []byte(`{"id":"bar"}`), out)
	assert.Nil(t, err)
	assert.Equal(t, true, actual)
	assert.Equal(t, "", out.String())

	actual, err = validator.Validate(context.Background(), []byte(`{"id":true}`), out)
	assert.Nil(t, err)
	assert.Equal(t, false, actual)
	assert.Equal(t, "Bad Request: Invalid input", out.String())

	actual, err = validator.Validate(context.Background(), []byte(`{"id":"bar","foo":"bar"}`), io.Discard)
	assert.Nil(t, err)
	assert.Equal(t, false, actual)

	_, err = NewValidator(brokenSchema, true)
	assert.Error(t, err)

	validator, err = NewValidator(validSchema, false)
	assert.NoError(t, err)

	out.Reset()
	actual, err = validator.Validate(context.Background(), []byte(`{"id":true}`), out)
	assert.Nil(t, err)
	assert.Equal(t, false, actual)
	assert.Equal(t, `{"code":"InputValidationError","message":"Bad Request: Invalid input","input":{"id":true},"errors":[{"propertyPath":"/id","invalidValue":true,"message":"type should be string, got boolean"}]}
`, out.String())

	out.Reset()
	actual, err = validator.Validate(context.Background(), []byte(`{}`), out)
	assert.Nil(t, err)
	assert.Equal(t, false, actual)
	assert.Equal(t, `{"code":"InputValidationError","message":"Bad Request: Invalid input","input":{},"errors":[{"propertyPath":"/","invalidValue":{},"message":"\"id\" value is required"}]}
`, out.String())
}

func BenchmarkValidator_Validate(b *testing.B) {
	validator, err := NewValidator(validSchema, true)
	assert.NoError(b, err)

	input := []byte(`{"id":"bar","foo":"bar"}`)
	ctx := context.Background()

	b.SetBytes(int64(len(input)))
	b.ReportAllocs()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		validator.Validate(ctx, input, io.Discard)
	}
}
