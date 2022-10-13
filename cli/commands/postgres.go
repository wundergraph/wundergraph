package commands

import (
	"encoding/json"
	"fmt"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/datasources/database"
	"github.com/wundergraph/wundergraph/pkg/files"
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
		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}

		databaseURL := args[0]
		log.Info("introspecting postgresql database", abstractlogger.String("url", databaseURL))
		introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "postgresql"
			url      = "%s"
		}`, databaseURL)
		prismaSchema, graphqlSDL, dmmf, err := database.IntrospectPrismaDatabase(introspectionSchema, wunderGraphDir, log)
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
