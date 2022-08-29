package files

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
)

const WunderGraphDir = ".wundergraph"

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

func findWunderGraphDir() (string, error) {
	// Check if we already operate inside .wundergraph directory
	wd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("could not get your current working directory")
	}

	parentWunderGraphDir := path.Join(wd, "..", WunderGraphDir)
	if DirectoryExists(parentWunderGraphDir) {
		return parentWunderGraphDir, nil
	}

	return "", fmt.Errorf("could not find .wundergraph directory")
}

// GetWunderGraphDir returns the absolute path to the .wundergraph directory.
// If the wundergraphDir can't be found we try to find it the parent directory.
func GetWunderGraphDir(wundergraphDir string) (string, error) {
	absWgDir, err := filepath.Abs(wundergraphDir)
	if err != nil {
		return "", fmt.Errorf("unable to get absolute path from .wundergraph dir: %w", err)
	}

	if !DirectoryExists(absWgDir) {
		dir, err := findWunderGraphDir()
		if err != nil {
			return "", err
		}
		return dir, nil
	}

	return absWgDir, nil
}

// GetValidFilePath returns the absolute path to the file and returns an error if the file does not exist.
func GetValidFilePath(wundergraphDir, filename string) (string, error) {
	configEntryPoint := path.Join(wundergraphDir, filename)

	if FileExists(configEntryPoint) {
		return configEntryPoint, nil
	}
	return "", fmt.Errorf(`code file "%s" not found`, configEntryPoint)
}
