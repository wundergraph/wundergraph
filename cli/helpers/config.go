package helpers

import "path/filepath"

func ConfigFilePath(wunderGraphDir string) string {
	return filepath.Join(wunderGraphDir, "generated", configJsonFilename)
}
