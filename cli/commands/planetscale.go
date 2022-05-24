package commands

import (
	"errors"
	"fmt"
	"net/url"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/datasources/database"
)

// postgresCmd represents the postgres command
var planetscaleCmd = &cobra.Command{
	Use:     "planetscale",
	Short:   "Introspects a planetscale database",
	Example: `wunderctl introspect planetscale mysql://xxx:pscale_pw_xxx@fwsbiox1njhc.eu-west-3.psdb.cloud/test?sslaccept=strict`,
	Args:    cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		databaseURL := args[0]
		parsed, err := url.Parse(databaseURL)
		if err != nil {
			return errors.New("invalid database url")
		}
		query := parsed.Query()
		query.Set("sslaccept", "strict")
		parsed.RawQuery = query.Encode()
		introspectionSchema := fmt.Sprintf(`datasource db {
			provider = "mysql"
			url      = "%s"
		}`, parsed.String())
		prismaSchema, graphqlSDL, dmmf, err := database.IntrospectPrismaDatabase(introspectionSchema, log)
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
	introspectCmd.AddCommand(planetscaleCmd)
}
