package s3uploadclient_test

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/wundergraph/wundergraph/pkg/s3uploadclient"
)

func TestS3UploadClient_UploadFile(t *testing.T) {
	if os.Getenv("INT") != "true" {
		t.Skip("Skipping testing in local environment")
	}

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
