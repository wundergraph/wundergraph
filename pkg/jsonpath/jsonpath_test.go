package jsonpath

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetKeys(t *testing.T) {
	data := map[string]interface{}{
		"a": 42,
		"b": map[string]interface{}{
			"a": 43,
		},
		"c": nil,
	}

	assert.Equal(t, 42, GetKeys(data, "a"))
	assert.Equal(t, map[string]interface{}{"a": 43}, GetKeys(data, "b"))
	assert.Equal(t, 43, GetKeys(data, "b", "a"))
	assert.Nil(t, GetKeys(data, "c"))
	assert.Nil(t, GetKeys(data, "zzzz"))
	assert.Nil(t, GetKeys(data, "a", "b", "c", "d"))
	assert.Nil(t, GetKeys(nil, "a"))
	assert.Nil(t, GetKeys(nil))
}

func TestSetKeys(t *testing.T) {
	assert.Equal(t, map[string]interface{}{"a": "b"}, SetKeys(nil, "b", "a"))
	assert.Equal(t, map[string]interface{}(nil), SetKeys(nil, nil))
	assert.Equal(t, map[string]interface{}{"a": "b"}, SetKeys(map[string]interface{}(nil), "b", "a"))
	assert.Equal(t, map[string]interface{}{"a": nil}, SetKeys(nil, nil, "a"))
	assert.Equal(t, map[string]interface{}{"a": map[string]interface{}{"b": "c"}}, SetKeys(nil, "c", "a", "b"))
	assert.Equal(t, map[string]interface{}{"d": 42}, SetKeys(map[string]interface{}{"d": "e"}, 42, "d"))
}
