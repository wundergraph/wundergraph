package files

import (
	"errors"
	"fmt"
	"os"
	"path"
	"path/filepath"
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

type WunderGraphEntryPoints struct {
	WunderGraphDir        string
	HooksServerEntryPoint string
	ConfigEntryPoint      string
}

// GetWunderGraphEntryPoints validates and resolves all code entry points and base directory to build a WunderGraph.
// If a file or directory can't be found an error is returned.
func GetWunderGraphEntryPoints(wundergraphDir, configEntryPointFilename, serverEntryPointFilename string) (*WunderGraphEntryPoints, error) {
	wundergraphAbsDir, err := filepath.Abs(wundergraphDir)
	if err != nil {
		return nil, err
	}

	if !DirectoryExists(wundergraphAbsDir) {
		return nil, fmt.Errorf(`base directory "%s" not found`, wundergraphAbsDir)
	}

	files := &WunderGraphEntryPoints{
		WunderGraphDir: wundergraphAbsDir,
	}

	configEntryPoint := path.Join(wundergraphDir, configEntryPointFilename)

	if FileExists(configEntryPoint) {
		files.ConfigEntryPoint = configEntryPoint
	} else {
		return nil, fmt.Errorf(`code file "%s" not found`, configEntryPoint)
	}

	hooksEntryPoint := path.Join(wundergraphDir, serverEntryPointFilename)

	if FileExists(hooksEntryPoint) {
		files.HooksServerEntryPoint = hooksEntryPoint
	} else {
		return nil, fmt.Errorf(`code file "%s" not found`, hooksEntryPoint)
	}

	return files, nil
}

func GetWunderGraphDirAbs() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	wundergraphDirectory := ""

	// next to it
	dirPath := path.Join(wd, ".wundergraph")

	// inside .wundergraph
	dirPath2 := path.Join(wd, "..", ".wundergraph")

	exists := DirectoryExists(dirPath)
	exists2 := DirectoryExists(dirPath2)

	if exists {
		wundergraphDirectory = dirPath
	} else if exists2 {
		wundergraphDirectory = dirPath2
	}

	if wundergraphDirectory == "" {
		return "", errors.New(".wundergraph directory not found")
	}

	absDir, err := filepath.Abs(wundergraphDirectory)
	if err != nil {
		return "", err
	}

	return absDir, nil
}
