package operations

import (
	"os"
	"path"
	"path/filepath"
	"strings"
)

const DirectoryName = "operations"

func GetPaths(wunderGraphDir string) ([]string, error) {
	webhooksDirectoryAbs := path.Join(wunderGraphDir, DirectoryName)
	// walk recursively through webhooksDirectoryAbs and find all .ts files
	// return the paths to the files
	var webhookFilePaths []string
	err := filepath.Walk(webhooksDirectoryAbs, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".ts") {
			webhookFilePaths = append(webhookFilePaths, path)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return webhookFilePaths, nil
}
