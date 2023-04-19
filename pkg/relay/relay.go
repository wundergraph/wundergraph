package relay

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Relay struct {
	operationsJsonPath string
}

func NewRelay(operationsJsonPath string) *Relay {
	return &Relay{
		operationsJsonPath: operationsJsonPath,
	}
}

type OperationsJson map[string]string

func (r *Relay) ExpandOperationsJson() error {
	// use filepath api to remove last element from r.operationsJsonPath
	dir := filepath.Dir(r.operationsJsonPath)
	content, err := os.ReadFile(r.operationsJsonPath)
	if err != nil {
		return err
	}
	var operations OperationsJson
	err = json.Unmarshal(content, &operations)
	if err != nil {
		return err
	}
	for operationHash, operationContent := range operations {
		outFile := filepath.Join(dir, operationHash+".graphql")
		// check if outfile exists, if so, compare content, if not, write
		_, err := os.Stat(outFile)
		if err == nil {
			// file exists, compare content
			existingContent, err := os.ReadFile(outFile)
			if err != nil {
				return err
			}
			if string(existingContent) == operationContent {
				continue
			}
		}
		err = os.WriteFile(outFile, []byte(operationContent), os.ModePerm)
		if err != nil {
			return err
		}
	}
	return nil
}
