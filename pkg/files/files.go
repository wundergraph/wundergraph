package files

import (
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
)

const (
	WunderGraphConfigFilename = "wundergraph.config.ts"
)

func DirectoryExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}

func FileExists(filePath string) bool {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return false
	}
	return true
}

// FindWunderGraphDir returns the absolute path to the directory of the wundergraph.config.ts file.
func FindWunderGraphDir(wundergraphDir string) (string, error) {
	absWgDir, err := filepath.Abs(wundergraphDir)
	if err != nil {
		return "", fmt.Errorf("unable to get absolute path of %s dir: %w", wundergraphDir, err)
	}

	wgDir := ""

	err = filepath.WalkDir(absWgDir,
		func(path string, info os.DirEntry, err error) error {
			if err != nil {
				return err
			}

			if info.IsDir() && info.Name() == "node_modules" {
				return filepath.SkipDir
			}

			if !info.IsDir() && info.Name() == WunderGraphConfigFilename {
				wgDir = filepath.Dir(path)
				return io.EOF
			}
			return nil
		})

	if err != nil && err != io.EOF {
		return "", fmt.Errorf(`unable to find %s in %s or children: %w`, WunderGraphConfigFilename, wundergraphDir, err)
	}

	return wgDir, nil
}

// CodeFilePath returns the absolute path to the file and returns an error if the file does not exist.
func CodeFilePath(wundergraphDir, filename string) (string, error) {
	configEntryPoint := path.Join(wundergraphDir, filename)

	if FileExists(configEntryPoint) {
		return configEntryPoint, nil
	}
	return "", fmt.Errorf(`code file "%s" not found`, configEntryPoint)
}
