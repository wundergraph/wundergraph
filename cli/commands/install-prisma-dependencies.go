package commands

import (
	"fmt"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/datasources/database"
	"github.com/wundergraph/wundergraph/pkg/files"
)

// introspectCmd represents the introspect command
var ensurePrismaCmd = &cobra.Command{
	Use:   "installPrismaDependencies",
	Short: "Installs Prisma Dependency",
	RunE: func(cmd *cobra.Command, args []string) error {
		wgDir, err := files.FindWunderGraphDir(wundergraphDir)
		if err != nil {
			return fmt.Errorf(files.WunderGraphDirNotFoundErrorMsg, err)
		}

		return database.InstallPrismaDependencies(log, wgDir)
	},
}

func init() {
	rootCmd.AddCommand(ensurePrismaCmd)
}
