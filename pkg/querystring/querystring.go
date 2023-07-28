package querystring

import (
	"encoding/json"
	"errors"
	"net/url"
	"regexp"
	"strings"

	"golang.org/x/exp/slices"
)

var (
	// ErrInvalidParam is returned when invalid data is provided to the ToJSON or Unmarshal function.
	// Specifically, this will be returned when there is no equals sign present in the URL query parameter.
	ErrInvalidParam error = errors.New("qson: invalid url query param provided")

	bracketSplitter *regexp.Regexp
)

func init() {
	bracketSplitter = regexp.MustCompile(`\[|\]`)
}

func ToJSON(query string, allowList []string) ([]byte, error) {

	if query == "" {
		return []byte("{}"), nil
	}

	if strings.Contains(query, "wg_variables") {
		values, err := url.ParseQuery(query)
		if err != nil {
			return nil, err
		}
		if values.Has("wg_variables") {
			return []byte(values.Get("wg_variables")), nil
		}
	}

	var (
		builder interface{} = make(map[string]any)
	)
	params := strings.Split(query, "&")
	for _, part := range params {
		if strings.HasPrefix(part, "wg_") {
			continue
		}
		tempMap, err := queryToMap(part, allowList)
		if err != nil {
			return nil, err
		}
		if tempMap == nil {
			continue
		}
		builder = merge(builder, tempMap)
	}
	return json.Marshal(builder)
}

func queryToMap(param string, allowList []string) (map[string]interface{}, error) {
	rawKey, rawValue, err := splitKeyAndValue(param)
	if err != nil {
		return nil, err
	}
	rawValue, err = url.QueryUnescape(rawValue)
	if err != nil {
		return nil, err
	}
	rawKey, err = url.QueryUnescape(rawKey)
	if err != nil {
		return nil, err
	}

	pieces := bracketSplitter.Split(rawKey, -1)
	key := pieces[0]

	if allowList != nil && !slices.Contains(allowList, key) {
		return nil, nil
	}

	// If len==1 then rawKey has no [] chars and we can just
	// decode this as key=value into {key: value}
	if len(pieces) == 1 {
		var value interface{}
		// First we try parsing it as an int, bool, null, etc
		err = json.Unmarshal([]byte(rawValue), &value)
		if err != nil {
			// If we got an error we try wrapping the value in
			// quotes and processing it as a string
			err = json.Unmarshal([]byte("\""+rawValue+"\""), &value)
			if err != nil {
				// If we can't decode as a string we return the err
				return nil, err
			}
		}
		return map[string]interface{}{
			key: value,
		}, nil
	}

	// If len > 1 then we have something like a[b][c]=2
	// so we need to turn this into {"a": {"b": {"c": 2}}}
	// To do this we break our key into two pieces:
	//   a and b[c]
	// and then we set {"a": queryToMap("b[c]", value)}
	ret := make(map[string]interface{}, 0)
	ret[key], err = queryToMap(buildNewKey(rawKey)+"="+rawValue, nil)
	if err != nil {
		return nil, err
	}

	// When URL params have a set of empty brackets (eg a[]=1)
	// it is assumed to be an array. This will get us the
	// correct value for the array item and return it as an
	// []interface{} so that it can be merged properly.
	if pieces[1] == "" {
		temp := ret[key].(map[string]interface{})
		ret[key] = []interface{}{temp[""]}
	}
	return ret, nil
}

// buildNewKey will take something like:
// origKey = "bar[one][two]"
// pieces = [bar one two ]
// and return "one[two]"
func buildNewKey(origKey string) string {
	pieces := bracketSplitter.Split(origKey, -1)
	ret := origKey[len(pieces[0])+1:]
	ret = ret[:len(pieces[1])] + ret[len(pieces[1])+1:]
	return ret
}

// splitKeyAndValue splits a URL param at the last equal
// sign and returns the two strings. If no equal sign is
// found, the ErrInvalidParam error is returned.
func splitKeyAndValue(param string) (string, string, error) {
	li := strings.LastIndex(param, "=")
	if li == -1 {
		return "", "", ErrInvalidParam
	}
	return param[:li], param[li+1:], nil
}

// merge merges a with b if they are either both slices
// or map[string]interface{} types. Otherwise it returns b.
func merge(a interface{}, b interface{}) interface{} {
	switch aT := a.(type) {
	case map[string]interface{}:
		return mergeMap(aT, b.(map[string]interface{}))
	case []interface{}:
		return mergeSlice(aT, b.([]interface{}))
	default:
		return b
	}
}

// mergeMap merges a with b, attempting to merge any nested
// values in nested maps but eventually overwriting anything
// in a that can't be merged with whatever is in b.
func mergeMap(a map[string]interface{}, b map[string]interface{}) map[string]interface{} {
	for bK, bV := range b {
		if _, ok := a[bK]; ok {
			a[bK] = merge(a[bK], bV)
		} else {
			a[bK] = bV
		}
	}
	return a
}

// mergeSlice merges a with b and returns the result.
func mergeSlice(a []interface{}, b []interface{}) []interface{} {
	a = append(a, b...)
	return a
}
