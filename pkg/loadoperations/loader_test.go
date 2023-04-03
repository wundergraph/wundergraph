package loadoperations

import (
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/wundergraph/graphql-go-tools/pkg/testing/goldie"
)

func newTestLoader(testdataName string) *Loader {
	operationsRootPath := filepath.Join("testdata", testdataName, "operations")
	fragmentsRootPath := filepath.Join("testdata", testdataName, "fragments")
	schemaFilePath := filepath.Join("testdata", testdataName, "schema.graphql")
	return NewLoader(operationsRootPath, fragmentsRootPath, schemaFilePath)
}

func TestIsValidOperationName(t *testing.T) {
	assert.True(t, isValidOperationName("Foo"))
	assert.True(t, isValidOperationName("Foo2"))
	assert.True(t, isValidOperationName("foo"))

	assert.False(t, isValidOperationName("2Foo"))
	assert.False(t, isValidOperationName("-Foo"))
	assert.False(t, isValidOperationName("Foo-"))
}

func TestLoader_Load(t *testing.T) {
	const dataName = "loadoperations"
	loader := newTestLoader(dataName)
	out, err := loader.Load(true)
	assert.NoError(t, err)

	goldie.New(t).Assert(t, dataName, []byte(out))
}
