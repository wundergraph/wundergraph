package commands

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
)

var (
	introspectionOutputFile string
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
	introspectCmd.PersistentFlags().StringVarP(&introspectionOutputFile, "outfile", "o", "", "If set, the introspection result will be written to the specified file")
}

func emitIntrospectionResult(result DatabaseIntrospectionResult) {
	data, err := json.Marshal(result)
	if err != nil {
		log.Error("Error while marshalling introspection result: %s",
			abstractlogger.Error(err),
		)
		return
	}
	if introspectionOutputFile != "" {
		dir := path.Dir(introspectionOutputFile)
		if _, err = os.Stat(dir); os.IsNotExist(err) {
			err = os.MkdirAll(dir, 0755)
			if err != nil {
				log.Error("Error while creating directory for introspection result: %s",
					abstractlogger.Error(err),
				)
				return
			}
		}
		err = ioutil.WriteFile(introspectionOutputFile, data, os.ModePerm)
		if err != nil {
			log.Error("Error while writing introspection result to file: %s",
				abstractlogger.Error(err),
			)
			return
		}
		return
	}
	fmt.Println(string(data))
}
