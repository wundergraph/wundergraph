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

type WunderGraphEntryPoints struct {
	Error               error
	ServerEntryPointAbs string
	ConfigEntryPointAbs string
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

// GetWunderGraphEntryPoints validates and resolves all code entry points to build WunderGraph.
// If the wundergraph.config.ts can't be found an error is returned. The wundergraph.server.ts is optional.
func GetWunderGraphEntryPoints(wundergraphDir, configEntryPointFilename, serverEntryPointFilename string) (*WunderGraphEntryPoints, error) {
	files := &WunderGraphEntryPoints{}

	configEntryPoint := path.Join(wundergraphDir, configEntryPointFilename)

	// wundergraph.config.ts
	if FileExists(configEntryPoint) {
		files.ConfigEntryPointAbs = configEntryPoint
	} else {
		return nil, fmt.Errorf(`code file "%s" not found`, configEntryPoint)
	}

	hooksEntryPoint := path.Join(wundergraphDir, serverEntryPointFilename)

	// wundergraph.server.ts
	if FileExists(hooksEntryPoint) {
		files.ServerEntryPointAbs = hooksEntryPoint
	} else {
		files.Error = fmt.Errorf(`code file "%s" not found`, hooksEntryPoint)
	}

	return files, nil
}
