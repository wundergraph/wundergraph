package commands

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/loadoperations"
)

var prettyOutput = false

const LoadOperationsCmdName = "loadoperations"

var loadoperationsCmd = &cobra.Command{
	Use:     LoadOperationsCmdName,
	Short:   "Loads the operations, internally used by the WunderGraph SDK",
	Example: fmt.Sprintf(`wunderctl %s $operationsRootPath $fragmentsRootPath $schemaFilePath`, LoadOperationsCmdName),
	RunE: func(cmd *cobra.Command, args []string) error {

		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}

		outFile := filepath.Join(wunderGraphDir, "generated", "wundergraph.operations.json")
		outFile, err = filepath.Abs(outFile)
		if err != nil {
			return err
		}

		loader := loadoperations.NewLoader(args[0], args[1], args[2])
		out, err := loader.Load(prettyOutput)
		if err != nil {
			return err
		}
		return os.WriteFile(outFile, []byte(out), 0644)
	},
	Args: cobra.ExactArgs(3),
}

func init() {
	rootCmd.AddCommand(loadoperationsCmd)
	loadoperationsCmd.PersistentFlags().BoolVar(&prettyOutput, "pretty-print", false, "Pretty print the output")
}
