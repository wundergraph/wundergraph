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
	const packageJSON = "package.json"
	// Find the first package.json walking up the wgDir
	abs, err := filepath.Abs(wgDir)
	if err != nil {
		return "", err
	}
	cur := abs
	for {
		if st, err := os.Stat(filepath.Join(cur, packageJSON)); err == nil && !st.IsDir() {
			// XXX: Make sure we initialize the introspection cache directory too, since we
			// do watch it from the Go side.
			cacheDir := filepath.Join(cur, "node_modules", ".cache", "wundergraph")
			introspectionCacheDir := filepath.Join(cacheDir, "introspection")
			if err := os.MkdirAll(introspectionCacheDir, 0755); err != nil {
				return "", err
			}
			return cacheDir, nil
		}
		next := filepath.Dir(cur)
		if next == cur {
			// We're at the root
			break
		}
		cur = next
	}
	return "", fmt.Errorf("could not find %s", packageJSON)
}
