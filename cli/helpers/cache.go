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
	// Find the top node_modules directory from the WunderGraph
	// directory by walking up
	abs, err := filepath.Abs(wgDir)
	if err != nil {
		return "", err
	}
	const nodeModulesDirName = "node_modules"
	topNodeModules := ""
	cur := abs
	for {
		nodeModules := filepath.Join(cur, nodeModulesDirName)
		if st, err := os.Stat(nodeModules); err == nil && st.IsDir() {
			topNodeModules = nodeModules
		}
		next := filepath.Dir(cur)
		if next == cur {
			// We're at the root
			break
		}
		cur = next
	}
	if topNodeModules != "" {
		return filepath.Join(topNodeModules, ".cache", ".wundergraph"), nil
	}
	return "", fmt.Errorf("could not find %s", nodeModulesDirName)
}
