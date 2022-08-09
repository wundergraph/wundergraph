package commands

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/loadoperations"
)

var loadoperationsCmd = &cobra.Command{
	Use:   "loadoperations",
	Short: "loads the operations, internally used by the wundergraph SDK",
	Long:  `loadoperations %operations path% %fragments path% %schema path%`,
	RunE: func(cmd *cobra.Command, args []string) error {
		loader := loadoperations.Loader{}
		out := loader.Load(args[0], args[1], args[2])
		fmt.Println(out)
		return nil
	},
	Args: cobra.ExactArgs(3),
}

func init() {
	rootCmd.AddCommand(loadoperationsCmd)
}
