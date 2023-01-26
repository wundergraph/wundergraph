package commands

import (
	"fmt"

	"github.com/spf13/cobra"
)

// postgresCmd represents the postgres command
var sqlserverCmd = &cobra.Command{
	Use:     "sqlserver",
	Short:   "Introspects a sqlserver database",
	Example: `Introspect sqlserver sqlserver://localhost:1433;database=wundergraph;schema=wg;user=SA;password=secure_Password;encrypt=true;trustServerCertificate=true`,
	Args:    cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		databaseURL := args[0]
		introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "sqlserver"
			url      = "%s"
		}`, databaseURL)
		return introspectDatabase(introspectionSchema)
	},
}

func init() {
	introspectCmd.AddCommand(sqlserverCmd)
}
