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

// GetWunderGraphConfigFilePath returns the absolute path to the wundergraph.config.ts file.
// If the file can't be found an error is returned.
func GetWunderGraphConfigFilePath(wundergraphDir, configEntryPointFilename string) (string, error) {
	configEntryPoint := path.Join(wundergraphDir, configEntryPointFilename)

	if FileExists(configEntryPoint) {
		return configEntryPoint, nil
	}
	return "", fmt.Errorf(`code file "%s" not found`, configEntryPoint)
}

// GetWunderGraphServerFilePath returns the absolute path to the wundergraph.server.ts file.
// If the file can't be found an error is returned.
func GetWunderGraphServerFilePath(wundergraphDir, serverEntryPointFilename string) (string, error) {
	hooksEntryPoint := path.Join(wundergraphDir, serverEntryPointFilename)

	if FileExists(hooksEntryPoint) {
		return hooksEntryPoint, nil
	}
	return "", fmt.Errorf(`code file "%s" not found`, hooksEntryPoint)
}
