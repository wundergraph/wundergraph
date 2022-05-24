package inputvariables

import (
	"context"
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

	actual := validator.Validate(context.Background(), []byte(`{}`))
	assert.Equal(t, true, actual)

	actual = validator.Validate(context.Background(), []byte(``))
	assert.Equal(t, false, actual)

	actual = validator.Validate(context.Background(), []byte(`{"foo":"bar"}`))
	assert.Equal(t, false, actual)

	validator, err = NewValidator(validSchema, true)
	assert.NoError(t, err)

	actual = validator.Validate(context.Background(), []byte(`{"id":"bar"}`))
	assert.Equal(t, true, actual)

	actual = validator.Validate(context.Background(), []byte(`{"id":true}`))
	assert.Equal(t, false, actual)

	actual = validator.Validate(context.Background(), []byte(`{"id":"bar","foo":"bar"}`))
	assert.Equal(t, false, actual)

	validator, err = NewValidator(brokenSchema, true)
	assert.Error(t, err)
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
		validator.Validate(ctx, input)
	}
}
