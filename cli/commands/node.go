package commands

import (
	"github.com/spf13/cobra"
)

var nodeCmd = &cobra.Command{
	Use:   "node",
	Short: "",
	Long:  ``,
	RunE: func(cmd *cobra.Command, args []string) error {
		return nil
	},
}

var nodeStartCmd = &cobra.Command{
	Use:   "start",
	Short: "",
	Long:  ``,
	RunE: func(cmd *cobra.Command, args []string) error {
		return nil
	},
}

func init() {
	nodeCmd.AddCommand(nodeStartCmd)
	rootCmd.AddCommand(nodeCmd)
}
