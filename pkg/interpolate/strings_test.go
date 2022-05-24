package interpolate

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

const (
	exampleJsonSchema = `{
			"type": "object",
			"properties": {
				"data": {
					"type": "object",
					"properties": {
						"findManyusers": {
							"type": "array",
							"items": {
								"type": "object",
								"properties": {
									"id": { "type": "integer" },
									"email": { "type": "string" },
									"name": { "type": "string" },
									"messages": {
										"type": "array",
										"items": {
											"type": "object",
											"properties": { "id": { "type": "integer" }, "message": { "type": "string" } },
											"additionalProperties": false,
											"required": ["id", "message"]
										}
									}
								},
								"additionalProperties": false,
								"required": ["id", "email", "name"]
							}
						}
					},
					"additionalProperties": false,
					"required": ["findManyusers"]
				}
			},
			"additionalProperties": false
		}`
	noOpSchema = `{
			"type": "object",
			"properties": {
				"data": {
					"type": "integer"
				}
			}
		}`
)

func TestStringInterpolator_Interpolate(t *testing.T) {
	interpolator, err := NewStringInterpolator(exampleJsonSchema)
	assert.NoError(t, err)

	input := `
{
	"data": {
		"findManyusers": [
			{
				"id": 1,
				"email": "jens@wundergraph.com",
				"name": "jens",
				"messages": [
					{
						"id": 1,
						"message": "hi!"
					}
				]
			},
			{
				"id": 2,
				"email": "jens@wundergraph.com",
				"name": true,
				"messages": [
					{
						"id": 2,
						"message": 123
					},
					{
						"id": 2,
						"message": 12.3
					},
					{
						"id": 2,
						"message": null
					},
					{
						"id": 2,
						"message": false
					}
				]
			}
		]
	}
}
`

	expected := `
{
	"data": {
		"findManyusers": [
			{
				"id": 1,
				"email": "jens@wundergraph.com",
				"name": "jens",
				"messages": [
					{
						"id": 1,
						"message": "hi!"
					}
				]
			},
			{
				"id": 2,
				"email": "jens@wundergraph.com",
				"name": "true",
				"messages": [
					{
						"id": 2,
						"message": "123"
					},
					{
						"id": 2,
						"message": "12.3"
					},
					{
						"id": 2,
						"message": null
					},
					{
						"id": 2,
						"message": "false"
					}
				]
			}
		]
	}
}
`

	actual := interpolator.Interpolate([]byte(input))
	assert.Equal(t, pretty(expected), pretty(string(actual)))
}

func TestStringInterpolator_StringifyJSON(t *testing.T) {
	interpolator, err := NewStringInterpolatorJSONOnly(`{"type":"object","properties":{"json":{},"int":{"type":"integer"},"nested":{"type":"object","properties":{"json":{},"int":{"type":"integer"}}}}}`)
	assert.NoError(t, err)

	input := `{"json":{"foo":"bar"},"int":123,"nested":{"json":{"foo":"bar"},"int":123}}`
	expected := `{"json":"{\"foo\":\"bar\"}","int":123,"nested":{"json":"{\"foo\":\"bar\"}","int":123}}`

	actual := interpolator.Interpolate([]byte(input))
	assert.Equal(t, pretty(expected), pretty(string(actual)))
}

func BenchmarkStringInterpolator_Interpolate(b *testing.B) {
	interpolator, err := NewStringInterpolator(exampleJsonSchema)
	assert.NoError(b, err)

	input := `
{
	"data": {
		"findManyusers": [
			{
				"id": 1,
				"email": "jens@wundergraph.com",
				"name": "jens",
				"messages": [
					{
						"id": 1,
						"message": "hi!"
					}
				]
			},
			{
				"id": 2,
				"email": "jens@wundergraph.com",
				"name": true,
				"messages": [
					{
						"id": 2,
						"message": 123
					},
					{
						"id": 2,
						"message": 12.3
					},
					{
						"id": 2,
						"message": null
					},
					{
						"id": 2,
						"message": false
					}
				]
			}
		]
	}
}
`

	inputBytes := []byte(input)
	b.ReportAllocs()
	b.SetBytes(int64(len(inputBytes)))
	b.ResetTimer()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			interpolator.Interpolate(inputBytes)
		}
	})
}

func BenchmarkStringInterpolator_InterpolateNoOp(b *testing.B) {
	interpolator, err := NewStringInterpolator(noOpSchema)
	assert.NoError(b, err)

	input := `
{
	"data": 123
}
`

	inputBytes := []byte(input)
	b.ReportAllocs()
	b.SetBytes(int64(len(inputBytes)))
	b.ResetTimer()

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			interpolator.Interpolate(inputBytes)
		}
	})
}

func pretty(input string) string {
	var temp interface{}
	err := json.Unmarshal([]byte(input), &temp)
	if err != nil {
		panic(err)
	}
	pretty, err := json.MarshalIndent(temp, "", "  ")
	if err != nil {
		panic(err)
	}
	return string(pretty)
}
