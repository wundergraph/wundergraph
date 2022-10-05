package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/signal"
	"path"
	"syscall"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

var nodeCmd = &cobra.Command{
	Use:   "node",
	Short: "Subcommand to work with WunderGraph node",
}

var nodeStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start runs WunderGraph Node in production mode",
	Long: `
		Example usage:
			wunderctl node start
`,
	RunE: func(cmd *cobra.Command, args []string) error {
		configFile := path.Join(WunderGraphDir, "generated", configJsonFilename)
		if !files.FileExists(configFile) {
			return fmt.Errorf("could not find configuration file: %s", configFile)
		}

		data, err := ioutil.ReadFile(configFile)
		if err != nil {
			log.Fatal("Failed to read file", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
			return err
		}
		if len(data) == 0 {
			log.Fatal("Config file is empty", abstractlogger.String("filePath", configFile))
			return nil
		}
		var graphConfig wgpb.WunderGraphConfiguration
		err = json.Unmarshal(data, &graphConfig)
		if err != nil {
			log.Fatal("Failed to unmarshal", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
			return err
		}

		ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		wunderNodeConfig := node.CreateConfig(&graphConfig)
		n := node.New(ctx, BuildInfo, WunderGraphDir, log)

		go func() {
			err := n.StartBlocking(
				node.WithStaticWunderNodeConfig(wunderNodeConfig),
				node.WithDebugMode(enableDebugMode),
			)
			if err != nil {
				log.Fatal("startBlocking", abstractlogger.Error(err))
			}
		}()

		gracefulTimeoutSeconds := 10
		n.HandleGracefulShutdown(gracefulTimeoutSeconds)

		return nil
	},
}

func init() {
	nodeCmd.AddCommand(nodeStartCmd)
	rootCmd.AddCommand(nodeCmd)
}
