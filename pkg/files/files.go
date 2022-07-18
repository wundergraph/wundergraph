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
	WunderGraphDirAbs   string
	ServerEntryPointAbs string
	ConfigEntryPointAbs string
}

// GetWunderGraphEntryPoints validates and resolves all code entry points and base directory to build a WunderGraph.
// If a file or directory can't be found an error is returned. ServerEntryPoint existence is optional.
func GetWunderGraphEntryPoints(wundergraphDir, configEntryPointFilename, serverEntryPointFilename string) (*WunderGraphEntryPoints, error) {
	wundergraphAbsDir, err := filepath.Abs(wundergraphDir)
	files := &WunderGraphEntryPoints{}

	if err != nil {
		files.Error = err
		return nil, err
	}

	// 1. Check if the ."wundergraph" directory exists
	if !DirectoryExists(wundergraphAbsDir) {
		// 2. If not, check if we already operate inside .wundergraph directory
		wd, err := os.Getwd()
		if err != nil {
			return nil, fmt.Errorf("could not get your current working directory")
		}
		parentWunderGraphDir := path.Join(wd, "..", WunderGraphDir)
		if DirectoryExists(parentWunderGraphDir) {
			files.WunderGraphDirAbs = parentWunderGraphDir
		} else {
			return nil, fmt.Errorf(`base directory "%s" not found`, wundergraphAbsDir)
		}
	} else {
		files.WunderGraphDirAbs = wundergraphAbsDir
	}

	configEntryPoint := path.Join(files.WunderGraphDirAbs, configEntryPointFilename)

	if FileExists(configEntryPoint) {
		files.ConfigEntryPointAbs = configEntryPoint
	} else {
		return nil, fmt.Errorf(`code file "%s" not found`, configEntryPoint)
	}

	hooksEntryPoint := path.Join(files.WunderGraphDirAbs, serverEntryPointFilename)

	if FileExists(hooksEntryPoint) {
		files.ServerEntryPointAbs = hooksEntryPoint
	} else {
		files.Error = fmt.Errorf(`code file "%s" not found`, hooksEntryPoint)
	}

	return files, nil
}
