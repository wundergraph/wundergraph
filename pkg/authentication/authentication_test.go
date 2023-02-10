package authentication

import (
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRemoveSubdmain(t *testing.T) {
	actual := removeSubdomain("api.app.local")
	assert.Equal(t, "app.local", actual)
	actual = removeSubdomain("app.local")
	assert.Equal(t, "app.local", actual)
	actual = removeSubdomain("api.app.example.com")
	assert.Equal(t, "app.example.com", actual)
}

func TestCustomClaims(t *testing.T) {
	st := reflect.TypeOf((*Claims)(nil)).Elem()
	for ii := 0; ii < st.NumField(); ii++ {
		field := st.Field(ii)
		tagName, ok := field.Tag.Lookup("json")
		if !ok {
			t.Errorf("field %s has no json tag", field.Name)
		}
		if tagName == "-" {
			continue
		}
		assert.Falsef(t, isCustomClaim(tagName), "tag %s should not be custom", tagName)
	}
	// Make sure isCustomClaim returns true for things we don't parse
	const testTag = "origin"
	assert.Truef(t, isCustomClaim(testTag), "%s should be a custom tag", testTag)
}
