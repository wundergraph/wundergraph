package jsonpatch

import (
	"fmt"
	"testing"

	"github.com/mattbaird/jsonpatch"
	"github.com/stretchr/testify/assert"
)

func TestJSONPatchSort(t *testing.T) {
	cases := []struct {
		input    []jsonpatch.JsonPatchOperation
		expected []jsonpatch.JsonPatchOperation
	}{
		{
			[]jsonpatch.JsonPatchOperation{},
			[]jsonpatch.JsonPatchOperation{},
		},
		{
			[]jsonpatch.JsonPatchOperation{
				{Operation: "remove", Path: "a/3"},
			},
			[]jsonpatch.JsonPatchOperation{
				{Operation: "remove", Path: "a/3"},
			},
		},
		{
			[]jsonpatch.JsonPatchOperation{
				{Operation: "remove", Path: "a/3"},
				{Operation: "remove", Path: "a/4"},
				{Operation: "remove", Path: "a"},
			},
			[]jsonpatch.JsonPatchOperation{
				{Operation: "remove", Path: "a/4"},
				{Operation: "remove", Path: "a/3"},
				{Operation: "remove", Path: "a"},
			},
		},
		{
			[]jsonpatch.JsonPatchOperation{
				{Operation: "remove", Path: "a/3"},
				{Operation: "add", Path: "a/3"},
				{Operation: "remove", Path: "a/4"},
			},
			[]jsonpatch.JsonPatchOperation{
				{Operation: "remove", Path: "a/3"},
				{Operation: "add", Path: "a/3"},
				{Operation: "remove", Path: "a/4"},
			},
		},
		{
			[]jsonpatch.JsonPatchOperation{
				{Operation: "remove", Path: "b/3"},
				{Operation: "remove", Path: "a/4"},
			},
			[]jsonpatch.JsonPatchOperation{
				{Operation: "remove", Path: "b/3"},
				{Operation: "remove", Path: "a/4"},
			},
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(fmt.Sprintf("%+v", tc.input), func(t *testing.T) {
			result := sortJSONPatch(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestJSONPatchCreate(t *testing.T) {
	const from = `{
		"data": {
			"deeds": [
				{ "deed_no": 10101010, "deed_source": null },
				{ "deed_no": 10000, "deed_source": null },
				{ "deed_no": 2000, "deed_source": null },
				{ "deed_no": 3999, "deed_source": null }
		  	]
		}
	}
	`

	const to = `{
		"data": {
			"deeds": [
				{ "deed_no": 10101010, "deed_source": null },
				{ "deed_no": 10000, "deed_source": null }
		  	]
		}
	}
	`

	patch, err := Create([]byte(from), []byte(to))
	assert.NoError(t, err)
	assert.Equal(t, patch[0].Path, "/data/deeds/3")
	assert.Equal(t, patch[1].Path, "/data/deeds/2")
}
