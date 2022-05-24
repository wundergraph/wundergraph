package interpolate

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/buger/jsonparser"
)

type StringInterpolator struct {
	schema            *Schema
	hasInterpolations bool
	jsonOnlyMode      bool
	defs              map[string]*Schema
	configuredDefs    map[string]struct{}
}

func NewStringInterpolator(schema string) (*StringInterpolator, error) {
	jsSchema := &Schema{}
	err := json.Unmarshal([]byte(schema), jsSchema)
	if err != nil {
		return nil, err
	}
	interpolator := &StringInterpolator{
		schema:         jsSchema,
		defs:           jsSchema.Defs,
		configuredDefs: map[string]struct{}{},
	}
	interpolator.configure(jsSchema)
	return interpolator, nil
}

func NewStringInterpolatorJSONOnly(schema string) (*StringInterpolator, error) {
	jsSchema := &Schema{}
	err := json.Unmarshal([]byte(schema), jsSchema)
	if err != nil {
		return nil, err
	}
	interpolator := &StringInterpolator{
		schema:         jsSchema,
		jsonOnlyMode:   true,
		configuredDefs: map[string]struct{}{},
	}
	interpolator.configure(jsSchema)
	return interpolator, nil
}

func (s *StringInterpolator) configure(schema *Schema) {
	if s.hasInterpolations {
		return
	}
	if schema.Ref != "" {
		if _, ok := s.configuredDefs[schema.Ref]; ok {
			return
		}
		s.configuredDefs[schema.Ref] = struct{}{}
		definitionName := strings.TrimPrefix(schema.Ref, "#/$defs/")
		definition, ok := s.defs[definitionName]
		if !ok {
			return
		}
		s.configure(definition)
		return
	}
	switch schema.typeString() {
	case "string":
		if s.jsonOnlyMode {
			return
		}
		s.hasInterpolations = true
	case "object":
		if schema.Properties == nil {
			return
		}
		for _, propSchema := range schema.Properties {
			s.configure(propSchema)
		}
	case "array":
		if schema.Items == nil {
			return
		}
		s.configure(schema.Items)
	case "":
		s.hasInterpolations = true
	}
}

func (s *StringInterpolator) traverse(schema *Schema, data *[]byte, path []string) {
	if schema.Ref != "" {
		definitionName := strings.TrimPrefix(schema.Ref, "#/$defs/")
		if s.defs != nil && s.defs[definitionName] != nil {
			schema = s.defs[definitionName]
		} else {
			return
		}
	}
	switch schema.typeString() {
	case "string":
		if s.jsonOnlyMode {
			return
		}
		value, dataType, _, err := jsonparser.Get(*data, path...)
		if err != nil {
			return
		}
		switch dataType {
		case jsonparser.Number, jsonparser.Boolean:
			if dataType != jsonparser.String {
				*data, _ = jsonparser.Set(*data, append([]byte("\""), append(value, []byte("\"")...)...), path...)
			}
		}
	case "object":
		if schema.Properties == nil {
			return
		}
		for prop, propSchema := range schema.Properties {
			isRequired := schema.IsRequired(prop)
			path := append(path, prop)
			_, _, _, err := jsonparser.Get(*data, path...)
			if err != nil && !isRequired {
				if propSchema.Ref != "" {
					definitionName := strings.TrimPrefix(propSchema.Ref, "#/$defs/")
					if s.defs != nil && s.defs[definitionName] != nil {
						propSchema = s.defs[definitionName]
					}
				}
				continue
			}
			s.traverse(propSchema, data, path)
		}
	case "array":
		if schema.Items == nil {
			return
		}
		var i int
		_, _ = jsonparser.ArrayEach(*data, func(value []byte, dataType jsonparser.ValueType, offset int, err error) {
			s.traverse(schema.Items, data, append(path, fmt.Sprintf("[%d]", i)))
			i++
		}, path...)
	case "":
		if !s.jsonOnlyMode {
			return
		}
		value, valueType, _, err := jsonparser.Get(*data, path...)
		if err != nil {
			return
		}
		switch valueType {
		case jsonparser.String:
			stringified := make([]byte, len(value)+2)
			stringified[0] = '"'
			stringified[len(stringified)-1] = '"'
			copy(stringified[1:], value)
			*data, _ = jsonparser.Set(*data, stringified, path...)
		default:
			stringified, err := json.Marshal(string(value))
			if err != nil {
				return
			}
			*data, _ = jsonparser.Set(*data, stringified, path...)
		}
	}
}

func (s *StringInterpolator) Interpolate(data []byte) []byte {
	if !s.hasInterpolations {
		return data
	}
	s.traverse(s.schema, &data, nil)
	return data
}

type Schema struct {
	Type       interface{}        `json:"type"`
	Properties map[string]*Schema `json:"properties"`
	Items      *Schema            `json:"items"`
	Required   []string           `json:"required"`
	Ref        string             `json:"$ref"`
	Defs       map[string]*Schema `json:"$defs"`
}

func (s *Schema) typeString() string {
	switch t := s.Type.(type) {
	case string:
		return t
	case []interface{}:
		for i := range t {
			str, ok := t[i].(string)
			if !ok {
				continue
			}
			if str != "null" {
				return str
			}
		}
	case []string:
		for i := range t {
			if t[i] != "null" {
				return t[i]
			}
		}
	}
	return ""
}

func (s *Schema) IsRequired(name string) bool {
	for _, required := range s.Required {
		if required == name {
			return true
		}
	}
	return false
}
