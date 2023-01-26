package commands

import (
	"fmt"

	"github.com/spf13/cobra"
)

// postgresCmd represents the postgres command
var mongoDbCmd = &cobra.Command{
	Use:     "mongodb",
	Short:   "Introspects a mongodb database",
	Example: `wunderctl mongodb mongodb+srv://test:test@cluster0.ns1yp.mongodb.net/myFirstDatabase`,
	Args:    cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		databaseURL := args[0]
		introspectionSchema := fmt.Sprintf(`datasource db {
  provider = "mongodb"
  url      = "%s"
}
`, databaseURL)
		return introspectDatabase(introspectionSchema)
	},
}

func init() {
	introspectCmd.AddCommand(mongoDbCmd)
}
