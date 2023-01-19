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
	fragmentsRootPath  string
	schemaFilePath     string
	out                *Output
}

func NewLoader(operationsRootPath string, fragmentsRootPath string, schemaFilePath string) *Loader {
	return &Loader{
		operationsRootPath: operationsRootPath,
		fragmentsRootPath:  fragmentsRootPath,
		schemaFilePath:     schemaFilePath,
		out:                &Output{},
	}
}

type GraphQLOperationFile struct {
	OperationName string `json:"operation_name"`
	ApiMountPath  string `json:"api_mount_path"`
	FilePath      string `json:"file_path"`
	Content       string `json:"content"`
}

type TypeScriptOperationFile struct {
	OperationName string `json:"operation_name"`
	ApiMountPath  string `json:"api_mount_path"`
	FilePath      string `json:"file_path"`
	ModulePath    string `json:"module_path"`
}

type Output struct {
	GraphQLOperationFiles    []GraphQLOperationFile    `json:"graphql_operation_files"`
	TypeScriptOperationFiles []TypeScriptOperationFile `json:"typescript_operation_files"`
	Invalid                  []string                  `json:"invalid,omitempty"`
	Errors                   []string                  `json:"errors,omitempty"`
	Info                     []string                  `json:"info,omitempty"`
}

func (l *Loader) Load(pretty bool) (string, error) {
	// check if schema file exists with os.Stat(schemaFilePath)
	if _, err := os.Stat(l.schemaFilePath); os.IsNotExist(err) {
		l.out.Errors = append(l.out.Errors, fmt.Sprintf("schema file %s does not exist", l.schemaFilePath))
		return "", nil
	}

	schemaBytes, err := os.ReadFile(l.schemaFilePath)
	if err != nil {
		l.out.Errors = append(l.out.Errors, fmt.Sprintf("error reading schema file %s", l.schemaFilePath))
		return "", nil
	}

	schemaDocument, report := astparser.ParseGraphqlDocumentBytes(schemaBytes)
	if report.HasErrors() {
		l.out.Errors = append(l.out.Errors, report.Error())
		return "", nil
	}

	err = asttransform.MergeDefinitionWithBaseSchema(&schemaDocument)
	if err != nil {
		l.out.Errors = append(l.out.Errors, fmt.Sprintf("error merging schema with base schema %s", l.schemaFilePath))
		return "", nil
	}

	fragments, err := l.loadFragments(&schemaDocument)
	if err != nil {
		l.out.Errors = append(l.out.Errors, fmt.Sprintf("error loading fragments %s", l.fragmentsRootPath))
		return "", nil
	}

	err = l.readOperations()
	if err != nil {
		l.out.Errors = append(l.out.Errors, err.Error())
		return l.encodeOutput(pretty)
	}

	l.loadOperations(fragments, &schemaDocument)

	return l.encodeOutput(pretty)
}

func (l *Loader) readOperations() error {
	return filepath.Walk(l.operationsRootPath, func(filePath string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		filePath, err = filepath.Rel(l.operationsRootPath, filePath)
		if err != nil {
			return err
		}

		switch {
		case strings.HasSuffix(filePath, ".ts"):
			l.readTypescriptOperation(filePath)
		case strings.HasSuffix(filePath, ".graphql"):
			l.readGraphQLOperation(filePath)
		default:
			l.out.Info = append(l.out.Info, fmt.Sprintf("skipping non .graphql file: %s", filePath))
		}

		return nil
	})
}

func (l *Loader) readTypescriptOperation(filePath string) {
	fileName := strings.TrimSuffix(strings.TrimPrefix(filePath, l.operationsRootPath+"/"), ".ts")
	typeScriptFile := TypeScriptOperationFile{
		OperationName: normalizeOperationName(fileName),
		ApiMountPath:  fileName,
		FilePath:      filePath,
		ModulePath:    path.Join("generated", "bundle", "operations", fileName),
	}
	l.out.TypeScriptOperationFiles = append(l.out.TypeScriptOperationFiles, typeScriptFile)
}

func (l *Loader) readGraphQLOperation(filePath string) {
	fileName := strings.TrimSuffix(strings.TrimPrefix(filePath, l.operationsRootPath+"/"), ".graphql")

	if !isValidOperationName(fileName) {
		l.out.Info = append(l.out.Info, fmt.Sprintf("file names must be alpanumeric only, skipping file: %s", fileName))
		return
	}

	l.out.GraphQLOperationFiles = append(l.out.GraphQLOperationFiles, GraphQLOperationFile{
		OperationName: normalizeOperationName(fileName),
		ApiMountPath:  fileName,
		FilePath:      filePath,
	})
}

func (l *Loader) loadOperations(fragments string, schemaDocument *ast.Document) {
	normalizer := astnormalization.NewWithOpts(astnormalization.WithRemoveFragmentDefinitions())

	for ii, file := range l.out.GraphQLOperationFiles {
		operation, err := l.loadOperation(file, normalizer, fragments, schemaDocument)
		if err != nil {
			l.out.Invalid = append(l.out.Invalid, file.OperationName)
			var ierr infoError
			if errors.As(err, &ierr) {
				l.out.Info = append(l.out.Errors, err.Error())
			} else {
				l.out.Errors = append(l.out.Errors, err.Error())
			}
		}
		if operation != "" {
			l.out.GraphQLOperationFiles[ii].Content = operation
		}
	}
}

func (l *Loader) encodeOutput(pretty bool) (string, error) {
	var indent = ""
	if pretty {
		indent = "  "
	}
	encodedOutput, err := json.MarshalIndent(l.out, "", indent)
	if err != nil {
		out := &Output{
			Errors: []string{err.Error()},
		}
		encodedOutput, err = json.MarshalIndent(out, "", indent)
		if err != nil {
			return "", err
		}
	}
	return string(encodedOutput), nil
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

	nameRef := doc.Input.AppendInputString(file.OperationName)
	doc.OperationDefinitions[0].Name = nameRef
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

func (l *Loader) loadFragments(schemaDocument *ast.Document) (string, error) {
	if _, err := os.Stat(l.fragmentsRootPath); os.IsNotExist(err) {
		return "", nil
	}
	var fragments string
	err := filepath.Walk(l.fragmentsRootPath, func(path string, info fs.FileInfo, err error) error {
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

func normalizeOperationName(s string) string {
	return strings.ReplaceAll(s, "/", "_")
}
