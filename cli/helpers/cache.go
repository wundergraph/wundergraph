package helpers

import (
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
