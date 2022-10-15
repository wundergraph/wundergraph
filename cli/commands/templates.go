package commands

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/templates"
)

// templatesCmd represents the templates command
var templatesCmd = &cobra.Command{
	Use:   "templates",
	Short: "List available templates for wunderctl init",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Printf("Available templates:\n")
		for _, tmpl := range templates.All() {
			fmt.Printf("\t%s\n", tmpl.Name)
		}
		return nil
	},
}

func init() {
	rootCmd.AddCommand(templatesCmd)
}
