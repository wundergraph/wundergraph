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
	validOperationNames := []string{
		"Foo",
		"Foo2",
		"foo",
		"__foo__",
		"__foo__/bar",
		"__foo/42",
		"foo/-42",
		"Foo-",
		"Foo_",
	}

	invalidOperationNames := []string{
		"2Foo",
		"-Foo",
		".Foo",
		"!Bar",
	}

	for _, name := range validOperationNames {
		name := name
		t.Run("valid "+name, func(t *testing.T) {
			assert.NoError(t, validateOperationName(name))
		})
	}

	for _, name := range invalidOperationNames {
		name := name
		t.Run("invalid "+name, func(t *testing.T) {
			assert.Error(t, validateOperationName(name))
		})
	}
}

func TestLoader_Load(t *testing.T) {
	const dataName = "loadoperations"
	loader := newTestLoader(dataName)
	out, err := loader.Load(true)
	assert.NoError(t, err)

	goldie.New(t).Assert(t, dataName, []byte(out))
}
