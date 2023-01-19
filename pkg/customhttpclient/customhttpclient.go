package customhttpclient

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"

	"github.com/buger/jsonparser"
	"github.com/hetiansu5/urlquery"
	"github.com/klauspost/compress/flate"
	"github.com/klauspost/compress/gzip"

	"github.com/wundergraph/graphql-go-tools/pkg/lexer/literal"

	"github.com/wundergraph/wundergraph/internal/unsafebytes"
)

const (
	ContentEncodingHeader = "Content-Encoding"
	AcceptEncodingHeader  = "Accept-Encoding"
)

var (
	queryParamsKeys = [][]string{
		{"name"},
		{"value"},
	}
)

// unescapeJSON tries to unescape the given JSON data over itself (to avoid)
// any allocations. This means that in case of an error the data will be
// malformed.
func unescapeJSON(in []byte) ([]byte, error) {
	// All variables that can be fed into Do()/DoWithStatus() output must be
	// first formatted as valid JSON. This means the only escaping that will
	// be added by the second encoding run is prepending a second "layer" of
	// escaping and this should all be "deescapable" onto the same source
	// slice because we're always at least writing one byte behind where we
	// read from.
	return jsonparser.Unescape(in, in)
}

func Do(client *http.Client, ctx context.Context, requestInput []byte, out io.Writer) (err error) {
	_, err = DoWithStatus(client, ctx, requestInput, out)
	return
}

func DoWithStatus(client *http.Client, ctx context.Context, requestInput []byte, out io.Writer) (int, error) {

	var (
		bodyReader io.Reader
	)

	url, method, body, urlencodebody, headers, queryParams := requestInputParams(requestInput)

	hasURLEncodeBody := bytes.Equal(urlencodebody, literal.TRUE)
	if !hasURLEncodeBody && len(body) != 0 {
		bodyReader = bytes.NewReader(body)
	}

	request, err := http.NewRequestWithContext(ctx, string(method), string(url), bodyReader)
	if err != nil {
		return 0, err
	}

	if headers != nil {
		err = jsonparser.ObjectEach(headers, func(key []byte, value []byte, dataType jsonparser.ValueType, offset int) error {
			_, err := jsonparser.ArrayEach(value, func(value []byte, dataType jsonparser.ValueType, offset int, err error) {
				if err != nil {
					return
				}
				request.Header.Add(string(key), string(value))
			})
			return err
		})
		if err != nil {
			return 0, err
		}
	}

	request.Header.Add("accept", "application/json")

	if hasURLEncodeBody {
		request.Body = nil
		request.Header.Set("content-type", "application/x-www-form-urlencoded")
		rawQuery, err := urlEncodeBody(body)
		if err != nil {
			return 0, err
		}
		request.URL.RawQuery = rawQuery
	} else {
		request.Header.Add("content-type", "application/json")
	}

	if queryParams != nil {
		rawQuery, err := encodeQueryParams(queryParams)
		if err != nil {
			return 0, err
		}
		request.URL.RawQuery = rawQuery
	}

	response, err := client.Do(request)
	if err != nil {
		return 500, err
	}
	defer response.Body.Close()

	respReader, err := respBodyReader(request, response)
	if err != nil {
		return response.StatusCode, err
	}

	_, err = io.Copy(out, respReader)
	return response.StatusCode, err
}

func respBodyReader(req *http.Request, resp *http.Response) (io.ReadCloser, error) {
	if req.Header.Get(AcceptEncodingHeader) == "" {
		return resp.Body, nil
	}

	switch resp.Header.Get(ContentEncodingHeader) {
	case "gzip":
		return gzip.NewReader(resp.Body)
	case "deflate":
		return flate.NewReader(resp.Body), nil
	}

	return resp.Body, nil
}

func encodeQueryParams(queryParams []byte) (string, error) {
	var jsonErr error
	query := make(url.Values)
	_, err := jsonparser.ArrayEach(queryParams, func(value []byte, dataType jsonparser.ValueType, offset int, err error) {
		if jsonErr != nil {
			return
		}
		jsonErr = err
		var (
			parameterName, parameterValue []byte
		)
		jsonparser.EachKey(value, func(i int, bytes []byte, valueType jsonparser.ValueType, err error) {
			if jsonErr != nil {
				return
			}
			if err != nil {
				jsonErr = err
				return
			}
			switch i {
			case 0:
				parameterName, jsonErr = unescapeJSON(bytes)
			case 1:
				parameterValue, jsonErr = unescapeJSON(bytes)
			}
		}, queryParamsKeys...)
		if len(parameterName) == 0 || len(parameterValue) == 0 {
			return
		}
		if bytes.Equal(parameterValue[:1], literal.LBRACK) {
			_, _ = jsonparser.ArrayEach(parameterValue, func(value []byte, dataType jsonparser.ValueType, offset int, err error) {
				query.Add(unsafebytes.BytesToString(parameterName), unsafebytes.BytesToString(value))
			})
		} else {
			query.Add(unsafebytes.BytesToString(parameterName), unsafebytes.BytesToString(parameterValue))
		}
	})
	if err != nil {
		return "", err
	}
	if jsonErr != nil {
		return "", err
	}
	return query.Encode(), nil
}

const (
	URL           = "url"
	METHOD        = "method"
	BODY          = "body"
	HEADER        = "header"
	QUERYPARAMS   = "query_params"
	URLENCODEBODY = "url_encode_body"
)

var (
	inputPaths = [][]string{
		{URL},
		{METHOD},
		{BODY},
		{HEADER},
		{QUERYPARAMS},
		{URLENCODEBODY},
	}
)

func requestInputParams(input []byte) (url, method, body, urlencodebody, headers, queryParams []byte) {
	jsonparser.EachKey(input, func(i int, bytes []byte, valueType jsonparser.ValueType, err error) {
		switch i {
		case 0:
			url = bytes
		case 1:
			method = bytes
		case 2:
			body = bytes
		case 3:
			headers = bytes
		case 4:
			queryParams = bytes
		case 5:
			urlencodebody = bytes
		}
	}, inputPaths...)
	return
}

func urlEncodeBody(body []byte) (string, error) {
	var input interface{}
	err := json.Unmarshal(body, &input)
	if err != nil {
		return "", err
	}
	out, err := urlquery.Marshal(input)
	if err != nil {
		return "", err
	}
	return string(out), nil
}
