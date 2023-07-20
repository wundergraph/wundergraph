package logging

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func expectTimestampAnd(t *testing.T, expected string, result string) {
	parts := strings.Split(result, " ")
	_, err := time.Parse(prettyTimestampFormat, parts[0])
	assert.NoError(t, err)
	withoutTimestamp := strings.Join(parts[1:], " ")
	assert.Equal(t, expected, withoutTimestamp)
}

func TestPrettifier(t *testing.T) {
	p := NewPrettifier(PrettifierConfig{
		DisableColor: true,
	})
	testCases := []struct {
		JSON     string
		Expected string
	}{
		{`{"level": "debug", "msg": "hello"}`, `DEBUG hello`},
		{`{"level": "warn", "msg": "hello", "a": "foo", "b": 42, "c": false }`, `WARN  hello a="foo" b=42 c=false`},
		{`{"level": "error", "a": "foo", "b": 42, "c": false }`, `ERROR a="foo" b=42 c=false`},
		{`{"level": "unknown"}`, `UNKNOWN`},
		{`{"level": "trace", "nested": {"nested1": {"nested2": true}}}`, `TRACE nested={"nested1":{"nested2":true}}`},
		{`{"level": "panic", "array": [1, true, "fan"]}`, `PANIC array=[1,true,"fan"]`},
	}
	for _, tc := range testCases {
		tc := tc
		t.Run(tc.JSON, func(t *testing.T) {
			t.Parallel()
			pretty, err := p.PrettifyJSON(strings.NewReader(tc.JSON))
			assert.NoError(t, err)
			if pretty != nil {
				// Prettified lines always end up with "\n"
				expectTimestampAnd(t, tc.Expected+"\n", pretty.String())
			}
		})
	}
}

func TestInvalidJSON(t *testing.T) {
	p := NewPrettifier(PrettifierConfig{
		DisableColor: true,
	})
	pretty, err := p.PrettifyJSON(strings.NewReader(`hello`))
	assert.Error(t, err)
	assert.Nil(t, pretty)
}

func TestJSONWithoutLevel(t *testing.T) {
	p := NewPrettifier(PrettifierConfig{
		DisableColor: true,
	})
	pretty, err := p.PrettifyJSON(strings.NewReader(`{"msg": "hello"}`))
	assert.Error(t, err)
	assert.Nil(t, pretty)
}
