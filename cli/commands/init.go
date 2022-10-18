package commands

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/templates"
)

var (
	templateName string
	outputPath   string
)

// initCmd represents the init command
var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Scaffold new WunderGraph projects using templates",
	Example: `
create a new project based on the "application" template:

wunderctl init

with flags

wunderctl init --template application --out . (defaults)

generate a GitHub action to deploy your WunderGraph API

wunderctl init --template github-deploy-action
`,
	RunE: func(cmd *cobra.Command, args []string) error {
		tmpl := templates.ByName(templateName)
		if tmpl == nil {
			return fmt.Errorf("template not found for name: %s", templateName)
		}
		return tmpl.Apply(outputPath)
	},
}

func init() {
	rootCmd.AddCommand(initCmd)

	initCmd.Flags().StringVarP(&templateName, "template", "t", "application", "template is the name of the template to use for init")
	initCmd.Flags().StringVarP(&outputPath, "out", "o", "", "out is an optional flag to override the default output path of the template")
}
