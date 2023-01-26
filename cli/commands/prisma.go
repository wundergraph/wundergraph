package commands

import (
	"io/ioutil"
	"path/filepath"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/files"
)

// postgresCmd represents the postgres command
var prismaCmd = &cobra.Command{
	Use:     "prisma",
	Short:   "Introspects a prisma database",
	Example: `wunderctl introspect prisma "./prisma/schema.prisma"`,
	Args:    cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		schemaFilePath := args[0]
		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}
		if !filepath.IsAbs(schemaFilePath) {
			schemaFilePath = filepath.Join(wunderGraphDir, schemaFilePath)
		}
		content, err := ioutil.ReadFile(schemaFilePath)
		if err != nil {
			return err
		}
		return introspectDatabase(string(content), false)
	},
}

func init() {
	introspectCmd.AddCommand(prismaCmd)
}
