package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"time"

	"github.com/spf13/cobra"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/datasources/database"
	"github.com/wundergraph/wundergraph/pkg/files"
)

var (
	introspectionOutputFile     string
	introspectionTimeoutSeconds int
)

// introspectCmd represents the introspect command
var introspectCmd = &cobra.Command{
	Use:   "introspect",
	Short: "Introspect DataSources",
	Long: `Introspect is a group of commands
to generate WunderGraph DataSources from various sources

Most of the time, you wouldn't directly use 'wunderctl introspect' directly.
It's used by the WunderGraph SDK internally.'`,
}

func init() {
	rootCmd.AddCommand(introspectCmd)
	introspectCmd.PersistentFlags().StringVarP(&introspectionOutputFile, "outfile", "o", "", "The introspection result will be written to the specified file")
	introspectCmd.PersistentFlags().IntVarP(&introspectionTimeoutSeconds, "timeout", "t", 30, "Timeout in seconds for the introspection process")
}

func introspectDatabase(introspectionSchema string, loadPrismaSchemaFromDatabase bool) error {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(introspectionTimeoutSeconds)*time.Second)
	defer cancel()
	start := time.Now()
	wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
	if err != nil {
		return err
	}
	prismaSchema, graphqlSDL, dmmf, err := database.IntrospectPrismaDatabase(ctx, introspectionSchema, wunderGraphDir, loadPrismaSchemaFromDatabase, log)
	if err != nil {
		return err
	}
	result := DatabaseIntrospectionResult{
		PrismaSchema:  prismaSchema,
		GraphQLSchema: graphqlSDL,
		Dmmf:          []byte(dmmf),
	}
	emitIntrospectionResult(result)
	if introspectionOutputFile != "" {
		log.Debug("Introspection Successful",
			zap.String("outfile", introspectionOutputFile),
			zap.String("duration", time.Since(start).String()),
		)
	}
	return nil
}

func emitIntrospectionResult(result DatabaseIntrospectionResult) {
	data, err := json.Marshal(result)
	if err != nil {
		log.Error("Error while marshalling introspection result: %s",
			zap.Error(err),
		)
		return
	}
	if introspectionOutputFile != "" {
		dir := path.Dir(introspectionOutputFile)
		if _, err = os.Stat(dir); os.IsNotExist(err) {
			err = os.MkdirAll(dir, 0755)
			if err != nil {
				log.Error("Error while creating directory for introspection result: %s",
					zap.Error(err),
				)
				return
			}
		}
		err = ioutil.WriteFile(introspectionOutputFile, data, os.ModePerm)
		if err != nil {
			log.Error("Error while writing introspection result to file: %s",
				zap.Error(err),
			)
			return
		}
		return
	}
	fmt.Println(string(data))
}
