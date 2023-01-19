package loadoperations

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/wundergraph/graphql-go-tools/pkg/testing/goldie"
)

func TestIsValidOperationName(t *testing.T) {
	assert.True(t, isValidOperationName("Foo"))
	assert.True(t, isValidOperationName("Foo2"))
	assert.True(t, isValidOperationName("foo"))

	assert.False(t, isValidOperationName("2Foo"))
	assert.False(t, isValidOperationName("-Foo"))
	assert.False(t, isValidOperationName("Foo-"))
}

func TestLoader_Load(t *testing.T) {
	loader := NewLoader("testdata/operations", "testdata/fragments", "testdata/schema.graphql")
	out, err := loader.Load(true)
	assert.NoError(t, err)

	goldie.New(t).Assert(t, "loadoperations", []byte(out))
}
