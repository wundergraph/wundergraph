package s3uploadclient_test

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"

	"github.com/wundergraph/wundergraph/pkg/s3uploadclient"
	"github.com/wundergraph/wundergraph/pkg/s3uploadclient/testdata"
)

func initClient() *s3uploadclient.S3UploadClient {
	client, err := s3uploadclient.NewS3UploadClient("localhost:9000", s3uploadclient.Options{
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
	// construct multipart form
	var buff bytes.Buffer
	w := multipart.NewWriter(&buff)

	fw, err := w.CreateFormFile("files", "testdata.json")
	if err != nil {
		panic(err)
	}

	if _, err := io.Copy(fw, testdata.GetUploadData()); err != nil {
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
