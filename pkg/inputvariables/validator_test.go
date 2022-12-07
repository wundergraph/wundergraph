package inputvariables

import (
	"bytes"
	"context"
	"io"
	"testing"

	"github.com/stretchr/testify/assert"
)

const (
	validEmptySchema       = `{"type":"object","properties":{},"additionalProperties":false}`
	validSchema            = `{"type":"object","properties":{"id":{"type":"string"}},"additionalProperties":false,"required":["id"]}`
	validNestedArraySchema = `{"type":"object","properties":{"foo":{"type":"string"},"bar":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"}},"additionalProperties":false,"required":["id"]}}},"additionalProperties":false,"required":["foo","bar"]}`
	brokenSchema           = `{"type":"object","properties":{"id":{"type":"foo"}},"additionalProperties":false,"required":["id"]}`
)

func TestValidator_Validate(t *testing.T) {
	validator, err := NewValidator(validEmptySchema, true)
	assert.NoError(t, err)

	actual := validator.Validate(context.Background(), []byte(`{}`), io.Discard)
	assert.Equal(t, true, actual)

	actual = validator.Validate(context.Background(), []byte(``), io.Discard)
	assert.Equal(t, false, actual)

	actual = validator.Validate(context.Background(), []byte(`{"foo":"bar"}`), io.Discard)
	assert.Equal(t, false, actual)

	validator, err = NewValidator(validSchema, true)
	assert.NoError(t, err)

	out := &bytes.Buffer{}
	actual = validator.Validate(context.Background(), []byte(`{"id":"bar"}`), out)
	assert.Equal(t, true, actual)
	assert.Equal(t, "", out.String())

	actual = validator.Validate(context.Background(), []byte(`{"id":true}`), out)
	assert.Equal(t, false, actual)
	assert.Equal(t, "Bad Request: Invalid input", out.String())

	actual = validator.Validate(context.Background(), []byte(`{"id":"bar","foo":"bar"}`), io.Discard)
	assert.Equal(t, false, actual)

	validator, err = NewValidator(brokenSchema, true)
	assert.Error(t, err)

	validator, err = NewValidator(validSchema, false)
	assert.NoError(t, err)

	out.Reset()
	actual = validator.Validate(context.Background(), []byte(`{"id":true}`), out)
	assert.Equal(t, false, actual)
	assert.Equal(t, `{"Message":"Bad Request: Invalid input","Input":{"id":true},"Errors":[{"propertyPath":"/id","invalidValue":true,"message":"type should be string, got boolean"}]}
`, out.String())

	out.Reset()
	actual = validator.Validate(context.Background(), []byte(`{}`), out)
	assert.Equal(t, false, actual)
	assert.Equal(t, `{"Message":"Bad Request: Invalid input","Input":{},"Errors":[{"propertyPath":"/","invalidValue":{},"message":"\"id\" value is required"}]}
`, out.String())

	out.Reset()
	validator, err = NewValidator(validNestedArraySchema, false)
	assert.NoError(t, err)
	actual = validator.Validate(context.Background(), []byte(`{"foo":"bar","bar":[{"id":"bar"}]}`), out)
	assert.Equal(t, true, actual)

	out.Reset()
	actual = validator.Validate(context.Background(), []byte(`{"foo":"bar","bar":[{"id":true}]}`), out)
	assert.Equal(t, false, actual)
	assert.Equal(t, `{"Message":"Bad Request: Invalid input","Input":{"foo":"bar","bar":[{"id":true}]},"Errors":[{"propertyPath":"/bar/0/id","invalidValue":true,"message":"type should be string, got boolean"}]}
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
