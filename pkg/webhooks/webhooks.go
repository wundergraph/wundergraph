package webhooks

import (
	"os"
	"path"
	"path/filepath"
)

const WebhookDirectoryName = "webhooks"

func GetWebhooks(wunderGraphDir string) ([]string, error) {
	webhooksDirectoryAbs := path.Join(wunderGraphDir, WebhookDirectoryName)
	des, err := os.ReadDir(webhooksDirectoryAbs)
	if err != nil {
		return nil, err
	}
	webhookFilePaths := make([]string, len(des))
	for i, entry := range des {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".ts" {
			continue
		}
		webhookFilePaths[i] = path.Join(WebhookDirectoryName, entry.Name())
	}
	return webhookFilePaths, nil
}
