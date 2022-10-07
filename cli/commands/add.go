package commands

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/manifest"
)

// addCmd represents the add command
var addCmd = &cobra.Command{
	Use:     "add",
	Short:   "Adds one or more dependencies to the wundergraph.manifest.json file",
	Example: `wunderctl add spacex/spacex`,
	Long:    `wunderctl add spacex/spacex jens/weather stripe/stripe`,
	Args:    cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, dependencies []string) error {
		client := InitWunderGraphApiClient()
		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}
		man := manifest.New(log, client, wunderGraphDir)
		err = man.Load()
		if err != nil {
			return fmt.Errorf("unable to load wundergraph.manifest.json")
		}
		err = man.AddDependencies(dependencies)
		if err != nil {
			return fmt.Errorf("unable to add dependencies %s to manifest", strings.Join(dependencies, ","))
		}
		err = man.PersistChanges()
		if err != nil {
			return fmt.Errorf("unable to persist manifest changes")
		}
		err = man.WriteIntegrationsFile()
		if err != nil {
			return fmt.Errorf("unable to write integrations file")
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(addCmd)
}
