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

	"github.com/wundergraph/wundergraph/pkg/relay"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"

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

		switch strings.ToLower(filepath.Ext(filePath)) {
		case ".ts":
			l.readTypescriptOperation(filePath)
		case ".graphql":
			l.readGraphQLOperation(filePath)
		case ".json":
			r := relay.NewRelay(filepath.Join(l.operationsRootPath, filePath))
			return r.ExpandOperationsJson()
		default:
			l.out.Info = append(l.out.Info, fmt.Sprintf("skipping non .graphql nor .ts file: %s", filePath))
		}

		return nil
	})
}

func (l *Loader) readTypescriptOperation(relativeFilePath string) {
	mountPath, operationName, ok := l.normalizedUniqueOperationName(relativeFilePath)
	if !ok {
		return
	}
	modulePath := filepath.ToSlash(filepath.Join("generated", "bundle", "operations", filepath.FromSlash(mountPath)))
	typeScriptFile := TypeScriptOperationFile{
		OperationName: operationName,
		ApiMountPath:  mountPath,
		FilePath:      relativeFilePath,
		ModulePath:    modulePath,
	}
	l.out.TypeScriptOperationFiles = append(l.out.TypeScriptOperationFiles, typeScriptFile)
}

// operationMountPath takes a relative native filename and returns a the URL path
// the operation should be mounted at. If the mount path results in an invalid
// operation name, it appends an INFO log message to the Loader's output and returns
// an empty string.
func (l *Loader) operationMountPath(relativeFilePath string) string {
	ext := filepath.Ext(relativeFilePath)
	relativeFilePathNonExt := relativeFilePath[:len(relativeFilePath)-len(ext)]
	unixLikeRelativeFilePathNonExt := filepath.ToSlash(relativeFilePathNonExt)

	if !isValidOperationName(unixLikeRelativeFilePathNonExt) {
		l.out.Info = append(l.out.Info, fmt.Sprintf("operation names must be alphanumeric only, skipping file: %s", relativeFilePath))
		return ""
	}

	return unixLikeRelativeFilePathNonExt
}

// ensureUniqueOperationName checks that the given normalized operationName is not already used
// by another operation. If the name is already taken, it appends an INFO log entry to
// the Loader's output and returns false. Otherwise it returns true.
func (l *Loader) normalizedUniqueOperationName(relativeFilePath string) (mountPath string, operationName string, ok bool) {
	mountPath = l.operationMountPath(relativeFilePath)
	if mountPath == "" {
		return "", "", false
	}
	operationName = normalizeOperationName(mountPath)

	for _, file := range l.out.GraphQLOperationFiles {
		if file.OperationName == operationName {
			l.out.Info = append(l.out.Info, fmt.Sprintf(
				"skipping file %s. Operation name collides with operation defined in: %s", relativeFilePath, file.FilePath))
			return "", "", false
		}
	}

	for _, file := range l.out.TypeScriptOperationFiles {
		if file.OperationName == operationName {
			l.out.Info = append(l.out.Info, fmt.Sprintf(
				"skipping file %s. Operation name collides with operation defined in: %s", relativeFilePath, file.FilePath))
			return "", "", false
		}
	}

	return mountPath, operationName, true
}

func (l *Loader) readGraphQLOperation(relativeFilePath string) {
	mountPath, operationName, ok := l.normalizedUniqueOperationName(relativeFilePath)
	if !ok {
		return
	}
	l.out.GraphQLOperationFiles = append(l.out.GraphQLOperationFiles, GraphQLOperationFile{
		OperationName: operationName,
		ApiMountPath:  mountPath,
		FilePath:      relativeFilePath,
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
		return "", fmt.Errorf("could not parse operation '%s': %s", file.OperationName, report.Error())
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
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) && r != '/' && r != '_' {
			return false
		}
	}
	return true
}

func normalizeOperationName(s string) string {
	parts := strings.Split(s, "/")
	caser := cases.Title(language.English, cases.NoLower)

	var out []string
	for _, part := range parts {
		out = append(out, caser.String(part))
	}
	return strings.Join(out, "")
}
