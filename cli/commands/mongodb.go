package commands

import (
	"fmt"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/datasources/database"
	"github.com/wundergraph/wundergraph/pkg/files"
)

// postgresCmd represents the postgres command
var mongoDbCmd = &cobra.Command{
	Use:     "mongodb",
	Short:   "Introspects a mongodb database",
	Example: `wunderctl mongodb mongodb+srv://test:test@cluster0.ns1yp.mongodb.net/myFirstDatabase`,
	Args:    cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}
		databaseURL := args[0]
		log.Info("introspecting mongodb", abstractlogger.String("url", databaseURL))
		introspectionSchema := fmt.Sprintf(`datasource db {
  provider = "mongodb"
  url      = "%s"
}
`, databaseURL)
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
	introspectCmd.AddCommand(mongoDbCmd)
}
