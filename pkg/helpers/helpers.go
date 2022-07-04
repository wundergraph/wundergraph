package helpers

import (
	"io"
	"os"
	"path/filepath"
)

func DirectoryExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}

func FindDirectory(wd string, name string) (string, error) {
	dirPath := ""
	err := filepath.WalkDir(wd,
		func(path string, info os.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if info.Name() == "node_modules" {
				return filepath.SkipDir
			}
			if info.Name() == name {
				dirPath = path
				return io.EOF
			}
			return nil
		})
	if err == io.EOF {
		err = nil
	}
	if err != nil {
		return dirPath, err
	}
	return dirPath, nil
}

func FileExists(filePath string) bool {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return false
	}
	return true
}
