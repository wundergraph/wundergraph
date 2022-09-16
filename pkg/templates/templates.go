package templates

import (
	"embed"
	_ "embed"
	"io/ioutil"
	"os"
	"path"
)

// Use scripts/copy-templates-to-cli.sh to sync the templates with the CLI

var (
	//go:embed assets/*
	//go:embed assets/templates/application/.wundergraph/*
	//go:embed assets/templates/application/.gitignore

	//go:embed assets/templates/publish-api/.wundergraph/*
	//go:embed assets/templates/publish-api/.gitignore

	//go:embed assets/templates/nextjs-starter/.wundergraph/*
	//go:embed assets/templates/nextjs-starter/pages/_app.tsx
	//go:embed assets/templates/nextjs-starter/.gitignore

	//go:embed assets/templates/nextjs-postgres-starter/.wundergraph/*
	//go:embed assets/templates/nextjs-postgres-starter/pages/_app.tsx
	//go:embed assets/templates/nextjs-postgres-starter/.gitignore
	files     embed.FS
	templates = []Template{
		{
			Name:     "application",
			InputDir: "assets/templates/application",
		},
		{
			Name:     "publish-api",
			InputDir: "assets/templates/publish-api",
		},
		{
			Name:     "nextjs-starter",
			InputDir: "assets/templates/nextjs-starter",
		},
		{
			Name:     "nextjs-postgres-starter",
			InputDir: "assets/templates/nextjs-postgres-starter",
		},
	}
)

func ByName(templateName string) *Template {
	for _, tmpl := range templates {
		if tmpl.Name == templateName {
			return &tmpl
		}
	}
	return nil
}

type Template struct {
	Name             string
	InputDir         string
	DefaultOutputDir string
}

func (t *Template) Apply(overrideOutputPath string) error {
	outPath := t.DefaultOutputDir
	if overrideOutputPath != "" {
		outPath = overrideOutputPath
	}
	return t.traverseDirectory(t.InputDir, outPath)
}

func (t *Template) traverseDirectory(inputDir, outputDir string) error {
	files := files
	entries, err := files.ReadDir(inputDir)
	if err != nil {
		return err
	}
	for _, entry := range entries {
		if entry.IsDir() {
			if err = t.traverseDirectory(path.Join(inputDir, entry.Name()), path.Join(outputDir, entry.Name())); err != nil {
				return err
			}
			continue
		}
		data, err := files.ReadFile(path.Join(inputDir, entry.Name()))
		if err != nil {
			return err
		}
		outFileName := path.Join(outputDir, entry.Name())
		_ = os.MkdirAll(path.Dir(outFileName), os.ModePerm)
		err = ioutil.WriteFile(outFileName, data, os.ModePerm)
		if err != nil {
			return err
		}
	}
	return nil
}
