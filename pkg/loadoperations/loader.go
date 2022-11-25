package loadoperations

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/wundergraph/graphql-go-tools/pkg/ast"
	"github.com/wundergraph/graphql-go-tools/pkg/astnormalization"
	"github.com/wundergraph/graphql-go-tools/pkg/astparser"
	"github.com/wundergraph/graphql-go-tools/pkg/astprinter"
	"github.com/wundergraph/graphql-go-tools/pkg/asttransform"
)

type Loader struct {
}

type GqlFile struct {
	OperationName string `json:"operation_name"`
	FilePath      string `json:"file_path"`
	Content       string `json:"content"`
}

type Output struct {
	Files   []GqlFile `json:"files"`
	Invalid []string  `json:"invalid"`
	Errors  []string  `json:"errors"`
	Info    []string  `json:"info"`
}

func (l *Loader) Load(operationsRootPath, fragmentsRootPath, schemaFilePath string) string {

	var (
		out Output
	)

	// check if schema file exists with os.Stat(schemaFilePath)
	if _, err := os.Stat(schemaFilePath); os.IsNotExist(err) {
		out.Errors = append(out.Errors, fmt.Sprintf("schema file %s does not exist", schemaFilePath))
		return ""
	}

	schemaBytes, err := os.ReadFile(schemaFilePath)
	if err != nil {
		out.Errors = append(out.Errors, fmt.Sprintf("error reading schema file %s", schemaFilePath))
		return ""
	}

	schemaDocument, report := astparser.ParseGraphqlDocumentBytes(schemaBytes)
	if report.HasErrors() {
		out.Errors = append(out.Errors, report.Error())
		return ""
	}

	err = asttransform.MergeDefinitionWithBaseSchema(&schemaDocument)
	if err != nil {
		out.Errors = append(out.Errors, fmt.Sprintf("error merging schema with base schema %s", schemaFilePath))
		return ""
	}

	fragments, err := l.loadFragments(&schemaDocument, fragmentsRootPath)
	if err != nil {
		out.Errors = append(out.Errors, fmt.Sprintf("error loading fragments %s", fragmentsRootPath))
		return ""
	}

	err = filepath.Walk(operationsRootPath, func(path string, info fs.FileInfo, err error) error {
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

	normalizer := astnormalization.NewWithOpts(astnormalization.WithRemoveFragmentDefinitions())

	for ii, file := range out.Files {
		operation, err := l.loadOperation(file, normalizer, fragments, &schemaDocument)
		if err != nil {
			out.Invalid = append(out.Invalid, file.OperationName)
			var ierr infoError
			if errors.As(err, &ierr) {
				out.Info = append(out.Errors, err.Error())
			} else {
				out.Errors = append(out.Errors, err.Error())
			}
		}
		if operation != "" {
			out.Files[ii].Content = operation
		}
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

type infoError string

func (e infoError) IsInfo() bool  { return true }
func (e infoError) Error() string { return string(e) }

func (l *Loader) loadOperation(file GqlFile, normalizer *astnormalization.OperationNormalizer, fragments string, schemaDocument *ast.Document) (string, error) {
	content, err := ioutil.ReadFile(file.FilePath)
	if err != nil {
		return "", fmt.Errorf("error reading file: %w", err)
	}
	doc, report := astparser.ParseGraphqlDocumentString(string(content) + fragments)
	if report.HasErrors() {
		return "", fmt.Errorf("error parsing operation: %s", report.Error())
	}
	if len(doc.OperationDefinitions) > 1 {
		return "", fmt.Errorf("graphql document must contain at most one operation: %s", file.FilePath)
	}

	if len(doc.OperationDefinitions) == 0 {
		return "", infoError(fmt.Sprintf("%s is empty, skipping", file))
	}

	normalizer.NormalizeOperation(&doc, schemaDocument, &report)
	if report.HasErrors() {
		return "", fmt.Errorf("error normalizing operation: %s, operationFilePath: %s", report.Error(), file.FilePath)
	}

	nameRef := doc.Input.AppendInputString(file.OperationName)
	doc.OperationDefinitions[0].Name = nameRef
	namedOperation, err := astprinter.PrintString(&doc, nil)
	if err != nil {
		return "", fmt.Errorf("error printing named operation: %s", err.Error())
	}

	return namedOperation, nil
}

func (l *Loader) loadFragments(schemaDocument *ast.Document, fragmentsRootPath string) (string, error) {
	if _, err := os.Stat(fragmentsRootPath); os.IsNotExist(err) {
		return "", nil
	}
	var fragments string
	err := filepath.Walk(fragmentsRootPath, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		if !strings.HasSuffix(path, ".graphql") {
			return nil
		}
		content, err := ioutil.ReadFile(path)
		if err != nil {
			return err
		}
		doc, report := astparser.ParseGraphqlDocumentBytes(content)
		if report.HasErrors() {
			return fmt.Errorf("error parsing fragment: %s", report.Error())
		}
		for i := range doc.RootNodes {
			if doc.RootNodes[i].Kind != ast.NodeKindFragmentDefinition {
				doc.RemoveRootNode(doc.RootNodes[i])
			}
		}
		onlyFragments, err := astprinter.PrintStringIndent(&doc, schemaDocument, "  ")
		if err != nil {
			return err
		}
		fragments += onlyFragments
		fragments += "\n\n"
		return nil
	})
	return fragments, err
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
