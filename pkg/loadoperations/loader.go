package loadoperations

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"io/ioutil"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/wundergraph/graphql-go-tools/pkg/astparser"
	"github.com/wundergraph/graphql-go-tools/pkg/astprinter"
)

type Loader struct {
}

type GqlFile struct {
	OperationName string `json:"operation_name"`
	FilePath      string `json:"file_path"`
	Content       string `json:"content"`
}

type Output struct {
	Files  []GqlFile `json:"files"`
	Errors []string  `json:"errors"`
	Info   []string  `json:"info"`
}

func (l *Loader) Load(dirName string) string {

	var (
		out Output
	)

	err := filepath.Walk(dirName, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		if !strings.HasSuffix(path, ".graphql") {
			out.Info = append(out.Info, fmt.Sprintf("skipping non .graphql file: %s", path))
			return nil
		}

		fileName := strings.TrimSuffix(info.Name(), ".graphql")

		if !isValidOperationName(fileName) {
			out.Info = append(out.Info, fmt.Sprintf("file names must be alpanumeric only, skipping file: %s", fileName))
			return nil
		}

		for _, file := range out.Files {
			if file.OperationName == fileName {
				out.Info = append(out.Info, fmt.Sprintf("skipping file due to duplicate file name: %s", fileName))
				return nil
			}
		}

		out.Files = append(out.Files, GqlFile{
			OperationName: fileName,
			FilePath:      path,
		})

		return nil
	})

	if err != nil {
		out.Errors = append(out.Errors, err.Error())
		encodedOutput, err := json.Marshal(out)
		if err != nil {
			out = Output{
				Errors: []string{err.Error()},
			}
			encodedOutput, _ = json.Marshal(out)
		}
		return string(encodedOutput)
	}

	for i, file := range out.Files {
		content, err := ioutil.ReadFile(file.FilePath)
		if err != nil {
			out.Errors = append(out.Errors, fmt.Sprintf("error reading file: %s", err.Error()))
			continue
		}
		doc, report := astparser.ParseGraphqlDocumentBytes(content)
		if report.HasErrors() {
			out.Errors = append(out.Errors, fmt.Sprintf("error parsing operation: %s", report.Error()))
			continue
		}
		if len(doc.OperationDefinitions) != 1 {
			out.Errors = append(out.Errors, fmt.Sprintf("graphql document must contain exactly one operation: %s\n", file.FilePath))
			continue
		}
		nameRef := doc.Input.AppendInputString(file.OperationName)
		doc.OperationDefinitions[0].Name = nameRef
		namedOperation, err := astprinter.PrintString(&doc, nil)
		if err != nil {
			out.Errors = append(out.Errors, fmt.Sprintf("error printing named operation: %s", err.Error()))
			continue
		}

		out.Files[i].Content = namedOperation
	}

	encodedOutput, err := json.Marshal(out)
	if err != nil {
		out = Output{
			Errors: []string{err.Error()},
		}
		encodedOutput, _ = json.Marshal(out)
	}
	return string(encodedOutput)
}

func isValidOperationName(s string) bool {
	if len(s) == 0 {
		return false
	}
	for i, r := range s {
		if i == 0 && !unicode.IsLetter(r) {
			return false
		}
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}
