package loadoperations

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/wundergraph/graphql-go-tools/pkg/ast"
	"github.com/wundergraph/graphql-go-tools/pkg/astnormalization"
	"github.com/wundergraph/graphql-go-tools/pkg/astparser"
	"github.com/wundergraph/graphql-go-tools/pkg/astprinter"
	"github.com/wundergraph/graphql-go-tools/pkg/asttransform"
	"github.com/wundergraph/graphql-go-tools/pkg/astvisitor"
)

type Loader struct {
	operationsRootPath string
}

type GraphQLOperationFile struct {
	OperationName string   `json:"operation_name"`
	FilePath      string   `json:"file_path"`
	Content       string   `json:"content"`
	Path          []string `json:"path"`
}

type TypeScriptOperationFile struct {
	OperationName string   `json:"operation_name"`
	FilePath      string   `json:"file_path"`
	Path          []string `json:"path"`
	ModulePath    string   `json:"module_path"`
}

type Output struct {
	GraphQLOperationFiles    []GraphQLOperationFile    `json:"graphql_operation_files"`
	TypeScriptOperationFiles []TypeScriptOperationFile `json:"typescript_operation_files"`
	Invalid                  []string                  `json:"invalid"`
	Errors                   []string                  `json:"errors"`
	Info                     []string                  `json:"info"`
}

func (l *Loader) Load(operationsRootPath, fragmentsRootPath, schemaFilePath string, pretty bool) (string, error) {

	l.operationsRootPath = operationsRootPath

	var (
		out Output
	)

	// check if schema file exists with os.Stat(schemaFilePath)
	if _, err := os.Stat(schemaFilePath); os.IsNotExist(err) {
		out.Errors = append(out.Errors, fmt.Sprintf("schema file %s does not exist", schemaFilePath))
		return "", nil
	}

	schemaBytes, err := os.ReadFile(schemaFilePath)
	if err != nil {
		out.Errors = append(out.Errors, fmt.Sprintf("error reading schema file %s", schemaFilePath))
		return "", nil
	}

	schemaDocument, report := astparser.ParseGraphqlDocumentBytes(schemaBytes)
	if report.HasErrors() {
		out.Errors = append(out.Errors, report.Error())
		return "", nil
	}

	err = asttransform.MergeDefinitionWithBaseSchema(&schemaDocument)
	if err != nil {
		out.Errors = append(out.Errors, fmt.Sprintf("error merging schema with base schema %s", schemaFilePath))
		return "", nil
	}

	fragments, err := l.loadFragments(&schemaDocument, fragmentsRootPath)
	if err != nil {
		out.Errors = append(out.Errors, fmt.Sprintf("error loading fragments %s", fragmentsRootPath))
		return "", nil
	}

	err = filepath.Walk(operationsRootPath, func(filePath string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		filePath, err = filepath.Rel(operationsRootPath, filePath)
		if err != nil {
			return err
		}
		if strings.HasSuffix(filePath, ".ts") {
			fileName := strings.TrimSuffix(strings.TrimPrefix(filePath, operationsRootPath+"/"), ".ts")
			typeScriptFile := TypeScriptOperationFile{
				OperationName: fileName,
				FilePath:      filePath,
				Path:          l.operationPath(fileName),
				ModulePath:    path.Join("generated", "bundle", "operations", fileName),
			}
			out.TypeScriptOperationFiles = append(out.TypeScriptOperationFiles, typeScriptFile)
			return nil
		}

		if !strings.HasSuffix(filePath, ".graphql") {
			out.Info = append(out.Info, fmt.Sprintf("skipping non .graphql file: %s", filePath))
			return nil
		}

		fileName := strings.TrimSuffix(strings.TrimPrefix(filePath, operationsRootPath+"/"), ".graphql")

		if !isValidOperationName(fileName) {
			out.Info = append(out.Info, fmt.Sprintf("file names must be alpanumeric only, skipping file: %s", fileName))
			return nil
		}

		for _, file := range out.GraphQLOperationFiles {
			if file.OperationName == fileName {
				out.Info = append(out.Info, fmt.Sprintf("skipping file due to duplicate file name: %s", fileName))
				return nil
			}
		}

		out.GraphQLOperationFiles = append(out.GraphQLOperationFiles, GraphQLOperationFile{
			OperationName: fileName,
			FilePath:      filePath,
			Path:          l.operationPath(fileName),
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
			if pretty {
				encodedOutput, err = json.MarshalIndent(out, "", "  ")
				if err != nil {
					return "", err
				}
			} else {
				encodedOutput, err = json.Marshal(out)
				if err != nil {
					return "", err
				}
			}
		}
		return string(encodedOutput), nil
	}

	normalizer := astnormalization.NewWithOpts(astnormalization.WithRemoveFragmentDefinitions())

	for ii, file := range out.GraphQLOperationFiles {
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
			out.GraphQLOperationFiles[ii].Content = operation
		}
	}

	if pretty {
		encodedOutput, err := json.MarshalIndent(out, "", "  ")
		if err != nil {
			return "", err
		}
		return string(encodedOutput), nil
	}
	encodedOutput, err := json.Marshal(out)
	if err != nil {
		return "", err
	}
	return string(encodedOutput), nil
}

func (l *Loader) operationPath(operationName string) []string {
	path := strings.Split(operationName, "/")
	if len(path) == 1 {
		return make([]string, 0)
	}
	return path[:len(path)-1]
}

type infoError string

func (e infoError) IsInfo() bool  { return true }
func (e infoError) Error() string { return string(e) }

func (l *Loader) loadOperation(file GraphQLOperationFile, normalizer *astnormalization.OperationNormalizer, fragments string, schemaDocument *ast.Document) (string, error) {
	content, err := ioutil.ReadFile(filepath.Join(l.operationsRootPath, file.FilePath))
	if err != nil {
		return "", fmt.Errorf("error reading file: %w", err)
	}
	doc, report := astparser.ParseGraphqlDocumentString(string(content) + fragments)
	if report.HasErrors() {
		return "", fmt.Errorf("error parsing operation: %s", report.Error())
	}
	ops := l.countOperations(&doc, schemaDocument)
	if ops != 1 {
		return "", fmt.Errorf("graphql document must contain exactly one operation: %s", file.FilePath)
	}

	normalizer.NormalizeOperation(&doc, schemaDocument, &report)
	if report.HasErrors() {
		return "", fmt.Errorf("error normalizing operation: %s, operationFilePath: %s", report.Error(), file.FilePath)
	}

	cleanedOperation, err := astprinter.PrintString(&doc, nil)
	if err != nil {
		return "", fmt.Errorf("error printing named operation: %s", err.Error())
	}

	return cleanedOperation, nil
}

type opCounter struct {
	count int
}

func (c *opCounter) EnterOperationDefinition(ref int) {
	c.count += 1
}

func (l *Loader) countOperations(doc *ast.Document, schema *ast.Document) int {
	walker := astvisitor.NewWalker(0)
	counter := &opCounter{}
	walker.RegisterEnterOperationVisitor(counter)
	walker.Walk(doc, schema, nil)
	return counter.count
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
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) && r != '/' {
			return false
		}
	}
	return true
}
