package validate

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMinLength(t *testing.T) {
	valid, messages := NewValidator("authentication.cookieBased.csrfTokenSecret", "test").
		Validate(MinLength(5))
	assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret must be at least 5 characters long")
	assert.False(t, valid)

	stringPointer := ""
	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", &stringPointer).
		Validate(MinLength(2))
	assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret must be at least 2 characters long")
	assert.False(t, valid)

	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", "test").
		Validate(MinLength(2))
	assert.Len(t, messages, 0)
	assert.True(t, valid)
}

func TestMaxLength(t *testing.T) {
	valid, messages := NewValidator("authentication.cookieBased.csrfTokenSecret", "test123").
		Validate(MaxLength(5))
	assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret must be at most 5 characters long")
	assert.False(t, valid)

	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", nil).
		Validate(MaxLength(5))
	assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret must be a string")
	assert.False(t, valid)

	stringPointer := ""
	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", &stringPointer).
		Validate(MaxLength(5))
	assert.Len(t, messages, 0)
	assert.True(t, valid)

	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", "te").
		Validate(MaxLength(2))
	assert.Len(t, messages, 0)
	assert.True(t, valid)
}

func TestLength(t *testing.T) {
	valid, messages := NewValidator("authentication.cookieBased.csrfTokenSecret", "test").
		Validate(Length(5))
	assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret must be exactly 5 characters long")
	assert.False(t, valid)

	stringPointer := ""
	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", &stringPointer).
		Validate(Length(4))
	assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret must be exactly 4 characters long")
	assert.False(t, valid)

	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", "test").
		Validate(Length(4))
	assert.Len(t, messages, 0)
	assert.True(t, valid)
}

func TestRequired(t *testing.T) {
	valid, messages := NewValidator("authentication.cookieBased.csrfTokenSecret", "").
		Validate(Required())
	assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret is required")
	assert.False(t, valid)

	stringPointer := ""
	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", &stringPointer).
		Validate(Required())
	assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret is required")
	assert.False(t, valid)

	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", nil).
		Validate(Required())
	assert.Equal(t, messages[0], "authentication.cookieBased.csrfTokenSecret is required")
	assert.False(t, valid)

	valid, messages = NewValidator("authentication.cookieBased.csrfTokenSecret", "t").
		Validate(Required())
	assert.Len(t, messages, 0)
	assert.True(t, valid)
}
