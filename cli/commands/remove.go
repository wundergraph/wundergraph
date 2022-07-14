package commands

import (
	"strings"

	"github.com/jensneuse/abstractlogger"
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
	Run: func(cmd *cobra.Command, dependencies []string) {
		if !files.DirectoryExists(wundergraphDir) {
			log.Fatal(`could not find base directory`, abstractlogger.String("dir", wundergraphDir))
		}

		client := InitWunderGraphApiClient()
		man := manifest.New(log, client, wundergraphDir)
		err := man.Load()
		if err != nil {
			_, _ = red.Printf("unable to load wundergraph.manifest.json")
			return
		}
		err = man.RemoveDependencies(dependencies)
		if err != nil {
			_, _ = red.Printf("unable to remove dependencies to manifest: %s", strings.Join(dependencies, ","))
			return
		}
		err = man.PersistChanges()
		if err != nil {
			_, _ = red.Printf("unable to persist manifest changes")
			return
		}
		err = man.WriteIntegrationsFile()
		if err != nil {
			_, _ = red.Printf("unable to write integrations file")
			return
		}
	},
}

func init() {
	rootCmd.AddCommand(removeCmd)
}
