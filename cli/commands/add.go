package commands

import (
	"strings"

	"github.com/jensneuse/abstractlogger"
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
		err = man.AddDependencies(dependencies)
		if err != nil {
			_, _ = red.Printf("unable to add dependencies to manifest: %s", strings.Join(dependencies, ","))
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
	rootCmd.AddCommand(addCmd)
}
