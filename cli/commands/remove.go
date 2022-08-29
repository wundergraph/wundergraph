package commands

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/manifest"
)

// removeCmd represents the remove command
var removeCmd = &cobra.Command{
	Use:     "remove",
	Short:   "Removes one or more dependencies from the wundergraph.manifest.json",
	Example: `wunderctl remove spacex/spacex`,
	Args:    cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, dependencies []string) error {
		wgDir, err := files.FindWunderGraphDir(wundergraphDir)
		if err != nil {
			return err
		}

		client := InitWunderGraphApiClient()
		man := manifest.New(log, client, wgDir)
		err = man.Load()
		if err != nil {
			return fmt.Errorf("unable to load wundergraph.manifest.json")
		}
		err = man.RemoveDependencies(dependencies)
		if err != nil {
			return fmt.Errorf("unable to remove dependencies to manifest: %s", strings.Join(dependencies, ","))
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
	rootCmd.AddCommand(removeCmd)
}
