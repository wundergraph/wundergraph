package webhooks

import (
	"os"
	"path"
	"strings"
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
		if entry.IsDir() || strings.HasSuffix(entry.Name(), ".d.ts") || !strings.HasSuffix(entry.Name(), ".ts") {
			continue
		}
		webhookFilePaths[i] = path.Join(WebhookDirectoryName, entry.Name())
	}
	return webhookFilePaths, nil
}
