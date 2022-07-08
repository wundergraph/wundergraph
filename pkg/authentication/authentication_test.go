package authentication

import (
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
