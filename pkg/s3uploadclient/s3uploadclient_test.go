package s3uploadclient_test

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/wundergraph/wundergraph/pkg/s3uploadclient"
)

const testData = `
{
  "data": {
    "__schema": {
      "queryType": {
        "name": "Query"
      },
      "mutationType": {
        "name": "Mutation"
      },
      "subscriptionType": {
        "name": "Subscription"
      }
    }
  }
}
`

func TestS3UploadClient_UploadFile(t *testing.T) {
	client := initClient()
	w, r := prepareRequest()

	client.UploadFile(w, r)

	res := w.Result()
	defer res.Body.Close()

	resp := make([]s3uploadclient.UploadedFile, 0)
	err := json.NewDecoder(res.Body).Decode(&resp)
	require.NoError(t, err)

	require.NotEmpty(t, resp)
	assert.Equal(t, "cec8f2d4d95a43d0.json", resp[0].Key)
}

func initClient() *s3uploadclient.S3UploadClient {
	client, err := s3uploadclient.NewS3UploadClient("127.0.0.1:9000", s3uploadclient.Options{
		BucketName:      "uploads",
		BucketLocation:  "eu-central-1",
		AccessKeyID:     "test",
		SecretAccessKey: "12345678",
		UseSSL:          false,
	})
	if err != nil {
		panic(err)
	}

	return client
}

func prepareRequest() (*httptest.ResponseRecorder, *http.Request) {
	file, err := os.CreateTemp("", "testdata.*.json")
	if err != nil {
		panic(err)
	}
	defer os.Remove(file.Name())

	_, err = io.Copy(file, bytes.NewReader([]byte(testData)))
	if err != nil {
		panic(err)
	}

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		panic(err)
	}

	// construct multipart form
	var buff bytes.Buffer
	w := multipart.NewWriter(&buff)

	fw, err := w.CreateFormFile("files", file.Name())
	if err != nil {
		panic(err)
	}

	if _, err := io.Copy(fw, file); err != nil {
		panic(err)
	}

	w.Close()

	// prepare request
	wr := httptest.NewRecorder()

	req, err := http.NewRequest("POST", "http://localhost:3003", &buff)
	if err != nil {
		panic(err)
	}

	req.Header.Add("Content-Type", w.FormDataContentType())

	return wr, req
}
