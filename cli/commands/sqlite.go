package commands

import (
	"fmt"

	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/datasources/database"
)

// postgresCmd represents the postgres command
var sqliteCmd = &cobra.Command{
	Use:     "sqlite",
	Short:   "Introspects a sqlite database",
	Example: `wunderctl introspect sqlite file:./dev.db`,
	Args:    cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		databaseURL := args[0]
		introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "sqlite"
			url      = "%s"
		}`, databaseURL)
		prismaSchema, graphqlSDL, dmmf, err := database.IntrospectPrismaDatabase(introspectionSchema, WunderGraphDir, log)
		if err != nil {
			return err
		}
		result := DatabaseIntrospectionResult{
			PrismaSchema:  prismaSchema,
			GraphQLSchema: graphqlSDL,
			Dmmf:          []byte(dmmf),
		}
		emitIntrospectionResult(result)
		return nil
	},
}

func init() {
	introspectCmd.AddCommand(sqliteCmd)
}
