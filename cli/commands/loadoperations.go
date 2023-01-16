package commands

import (
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/loadoperations"
)

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

		outFile := path.Join(wunderGraphDir, "generated", "wundergraph.operations.json")
		outFile, err = filepath.Abs(outFile)
		if err != nil {
			return err
		}

		loader := loadoperations.Loader{}
		out, err := loader.Load(args[0], args[1], args[2], rootFlags.Pretty)
		if err != nil {
			return err
		}
		return ioutil.WriteFile(outFile, []byte(out), os.ModePerm)
	},
	Args: cobra.ExactArgs(3),
}

func init() {
	rootCmd.AddCommand(loadoperationsCmd)
}
