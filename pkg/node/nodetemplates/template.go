package nodetemplates

import (
	"embed"
	"fmt"
	"html/template"
)

var (
	//go:embed resources
	res   embed.FS
	pages = map[string]string{
		"/": "resources/index.gohtml",
	}
)

func GetTemplateByPath(path string) (*template.Template, error) {
	page, ok := pages[path]
	if !ok {
		return nil, fmt.Errorf("page not found: %s", path)
	}
	tpl, err := template.ParseFS(res, page)
	if err != nil {
		return nil, err
	}

	return tpl, nil
}
