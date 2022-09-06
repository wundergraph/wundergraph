package loadoperations

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsValidOperationName(t *testing.T) {
	assert.True(t, isValidOperationName("Foo"))
	assert.True(t, isValidOperationName("Foo2"))
	assert.True(t, isValidOperationName("foo"))

	assert.False(t, isValidOperationName("2Foo"))
	assert.False(t, isValidOperationName("-Foo"))
	assert.False(t, isValidOperationName("Foo-"))
}
