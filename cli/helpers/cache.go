package helpers

import (
	"fmt"
	"os"
	"path/filepath"
)

// GlobalWunderGraphCacheDir returns the path to the global
// cache directory for WunderGraph
func GlobalWunderGraphCacheDir() (string, error) {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(cacheDir, "wundergraph"), nil
}

// LocalWunderGraphCacheDir returns the absolute path to the
// cache directory for the current WunderGraph app
func LocalWunderGraphCacheDir(wgDir string) (string, error) {
	// Use the local node_modules directory, creating it if it doesn't exist
	cachePath := filepath.Join("node_modules", ".cache", "wundergraph")
	if err := os.MkdirAll(cachePath, 0755); err != nil {
		return "", fmt.Errorf("creating cache directory: %w", err)
	}
	return cachePath, nil
}
