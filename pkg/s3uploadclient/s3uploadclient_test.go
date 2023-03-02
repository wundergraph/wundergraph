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

	resp := w.Result()
	defer resp.Body.Close()

	var decoded []s3uploadclient.UploadedFile
	err := json.NewDecoder(resp.Body).Decode(&decoded)
	require.NoError(t, err)

	require.NotEmpty(t, resp)
	assert.Equal(t, "cec8f2d4d95a43d0.json", decoded[0].Key)
}
