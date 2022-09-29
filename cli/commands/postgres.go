package commands

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/datasources/database"
)

type DatabaseIntrospectionResult struct {
	PrismaSchema  string          `json:"prisma_schema"`
	GraphQLSchema string          `json:"graphql_schema"`
	Dmmf          json.RawMessage `json:"dmmf"`
}

// postgresCmd represents the postgres command
var postgresCmd = &cobra.Command{
	Use:     "postgresql",
	Short:   "Introspects a postgres database",
	Example: `wunderctl introspect postgresql postgresql://user:password@localhost:5432/database?schema=public`,
	Args:    cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		databaseURL := args[0]
		introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "postgresql"
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
	introspectCmd.AddCommand(postgresCmd)
}
