package commands

import (
	"fmt"

	"github.com/spf13/cobra"
)

// postgresCmd represents the postgres command
var mysqlCmd = &cobra.Command{
	Use:     "mysql",
	Short:   "Introspects a mysql database",
	Example: `wunderctl introspect mysql mysql://user:password@localhost:5432/database`,
	Args:    cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		databaseURL := args[0]
		introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "mysql"
			url      = "%s"
		}`, databaseURL)
		return introspectDatabase(introspectionSchema, true)
	},
}

func init() {
	introspectCmd.AddCommand(mysqlCmd)
}
