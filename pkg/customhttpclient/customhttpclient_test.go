package customhttpclient

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestURLEncodeBody(t *testing.T) {
	input := `{"line_items":[{"price":"123","quantity":1}],"success_url":"http://localhost:8111/success","cancel_url":"http://localhost:8111/cancel","mode":"mode"}`
	out, err := urlEncodeBody([]byte(input))
	assert.NoError(t, err)

	actual := "line_items%5B0%5D%5Bprice%5D=123&line_items%5B0%5D%5Bquantity%5D=1&success_url=http%3A%2F%2Flocalhost%3A8111%2Fsuccess&cancel_url=http%3A%2F%2Flocalhost%3A8111%2Fcancel&mode=mode"
	assert.Equal(t, len(actual), len(out))
}

func TestEncodeQueryParams(t *testing.T) {
	testCases := []struct {
		input string
		want  url.Values
	}{
		{"[{\"name\":\"foo\",\"value\":\"\\\"bar\"}]", url.Values{"foo": []string{"\"bar"}}},
	}
	for _, tc := range testCases {
		encoded, err := encodeQueryParams([]byte(tc.input))
		assert.Nil(t, err, "should not fail to encode query params")
		decoded, err := url.ParseQuery(string(encoded))
		assert.Nil(t, err, "should not fail to decode query params")
		assert.Equal(t, tc.want, decoded)
	}
}
