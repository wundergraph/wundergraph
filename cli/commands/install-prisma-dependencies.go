package commands

import (
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/datasources/database"
	"github.com/wundergraph/wundergraph/pkg/files"
)

// introspectCmd represents the introspect command
var ensurePrismaCmd = &cobra.Command{
	Use:   "installPrismaDependencies",
	Short: "Installs Prisma Dependency",
	RunE: func(cmd *cobra.Command, args []string) error {
		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}
		return database.InstallPrismaDependencies(log, wunderGraphDir)
	},
}

func init() {
	rootCmd.AddCommand(ensurePrismaCmd)
}
