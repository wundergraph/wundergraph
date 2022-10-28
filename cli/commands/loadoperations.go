package commands

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/loadoperations"
)

const LoadOperationsCmdName = "loadoperations"

var loadoperationsCmd = &cobra.Command{
	Use:     LoadOperationsCmdName,
	Short:   "Loads the operations, internally used by the WunderGraph SDK",
	Example: fmt.Sprintf(`wunderctl %s $operationsRootPath $fragmentsRootPath $schemaFilePath`, LoadOperationsCmdName),
	RunE: func(cmd *cobra.Command, args []string) error {
		loader := loadoperations.Loader{}
		out := loader.Load(args[0], args[1], args[2])
		// TODO: migrate to writing it to file because it can infer with logs
		// or log and print to two different streams and respect that on the consumer side
		fmt.Println(out.String())
		return nil
	},
	Args: cobra.ExactArgs(3),
}

func init() {
	rootCmd.AddCommand(loadoperationsCmd)
}
