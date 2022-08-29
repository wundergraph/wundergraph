package files

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
)

const (
	WunderGraphDirName = ".wundergraph"
)

func ErrWunderGraphDirNotFound(err error) error {
	return fmt.Errorf(`unable to find .wundergraph dir: %w`, err)
}

func ErrCodeFileNotFound(filename string) error {
	return fmt.Errorf(`code file "%s" not found`, filename)
}

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

func findWunderGraphDirInParent() (string, error) {
	// Check if we already operate inside .wundergraph directory
	wd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("could not get your current working directory")
	}

	parentWunderGraphDir := path.Join(wd, "..", WunderGraphDirName)
	if DirectoryExists(parentWunderGraphDir) {
		return parentWunderGraphDir, nil
	}

	return "", fmt.Errorf("could not find .wundergraph directory")
}

// FindWunderGraphDir returns the absolute path to the .wundergraph directory.
// If the wundergraphDir can't be found we try to find it in the parent directory.
func FindWunderGraphDir(wundergraphDir string) (string, error) {
	absWgDir, err := filepath.Abs(wundergraphDir)
	if err != nil {
		return "", fmt.Errorf("unable to get absolute path from .wundergraph dir: %w", err)
	}

	if !DirectoryExists(absWgDir) {
		dir, err := findWunderGraphDirInParent()
		if err != nil {
			return "", err
		}
		return dir, nil
	}

	return absWgDir, nil
}

// CodeFilePath returns the absolute path to the file and returns an error if the file does not exist.
func CodeFilePath(wundergraphDir, filename string) (string, error) {
	configEntryPoint := path.Join(wundergraphDir, filename)

	if FileExists(configEntryPoint) {
		return configEntryPoint, nil
	}
	return "", fmt.Errorf(`code file "%s" not found`, configEntryPoint)
}
