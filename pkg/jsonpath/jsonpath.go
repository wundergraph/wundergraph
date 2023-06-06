// Package jsonpath implements a subset of JSON path over maps and slices
package jsonpath

// GetKeys retrieves the value at the given path by following each key in data. If
// data is not a map or if a key is not present, it returns nil.
func GetKeys(data interface{}, jsonKeys ...string) interface{} {
	if len(jsonKeys) == 0 {
		return nil
	}
	return getKeys(data, jsonKeys, 0)
}

func getKeys(data interface{}, keys []string, keyIndex int) interface{} {
	key := keys[keyIndex]
	if m, ok := data.(map[string]interface{}); ok {
		item := m[key]
		if keyIndex == len(keys)-1 {
			return item
		}
		return getKeys(item, keys, keyIndex+1)
	}
	return nil
}

func SetKeys(data interface{}, value interface{}, jsonKeys ...string) map[string]interface{} {
	if len(jsonKeys) == 0 {
		return nil
	}
	return setKeys(data, value, jsonKeys, 0)
}

func setKeys(data interface{}, value interface{}, jsonKeys []string, keyIndex int) map[string]interface{} {
	key := jsonKeys[keyIndex]
	m, _ := data.(map[string]interface{})
	if m == nil {
		m = map[string]interface{}{}
	}
	nextKeyIndex := keyIndex + 1
	if nextKeyIndex < len(jsonKeys) {
		m[key] = setKeys(m[key], value, jsonKeys, nextKeyIndex)
	} else {
		m[key] = value
	}
	return m
}
