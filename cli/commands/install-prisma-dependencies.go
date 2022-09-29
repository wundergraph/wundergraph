package commands

import (
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/datasources/database"
)

// introspectCmd represents the introspect command
var ensurePrismaCmd = &cobra.Command{
	Use:   "installPrismaDependencies",
	Short: "Installs Prisma Dependency",
	RunE: func(cmd *cobra.Command, args []string) error {
		return database.InstallPrismaDependencies(log, WunderGraphDir)
	},
}

func init() {
	rootCmd.AddCommand(ensurePrismaCmd)
}
