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
	var webhookFilePaths []string
	for _, entry := range des {
		if entry.IsDir() || strings.HasSuffix(entry.Name(), ".d.ts") || !strings.HasSuffix(entry.Name(), ".ts") {
			continue
		}
		webhookFilePaths = append(webhookFilePaths, path.Join(WebhookDirectoryName, entry.Name()))
	}
	return webhookFilePaths, nil
}
