package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/runners"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

var nodeCmd = &cobra.Command{
	Use:   "node",
	Short: "Subcommand to work with WunderGraph node",
	RunE: func(cmd *cobra.Command, args []string) error {
		return nil
	},
}

var nodeStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start runs WunderGraph Node in production mode",
	Long: `
		Example usage:
			WG_SECRET=secret WG_SERVER_URL=http://127.0.0.1:9992 WG_NODE_ADDR=127.0.0.1:9991 wunderctl node start
`,
	RunE: func(cmd *cobra.Command, args []string) error {
		wgDir, err := files.FindWunderGraphDir(wundergraphDir)
		if err != nil {
			return err
		}

		configFile := path.Join(wgDir, "generated", "wundergraph.config.json")
		if !files.FileExists(configFile) {
			return fmt.Errorf("could not find configuration file: %s", configFile)
		}

		data, err := ioutil.ReadFile(configFile)
		if err != nil {
			log.Fatal("Failed to read file", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
			return err
		}
		if len(data) == 0 {
			log.Fatal("Config file is empty", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
			return nil
		}
		var graphConfig wgpb.WunderGraphConfiguration
		err = json.Unmarshal(data, &graphConfig)
		if err != nil {
			log.Fatal("Failed to unmarshal", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
			return err
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		gracefulTimeoutSeconds := 10
		shutdownHandler := runners.NewNodeShutdownHandler(log, gracefulTimeoutSeconds)

		wunderNodeConfig := node.CreateConfig(&graphConfig)

		n := node.New(ctx, BuildInfo, log)

		go func() {
			err := n.StartBlocking(
				node.WithStaticWunderNodeConfig(wunderNodeConfig),
				node.WithDebugMode(enableDebugMode),
			)
			if err != nil {
				log.Fatal("startBlocking", abstractlogger.Error(err))
			}
		}()

		shutdownHandler.HandleGracefulShutdown(ctx, n)

		return nil
	},
}

func init() {
	nodeCmd.AddCommand(nodeStartCmd)
	rootCmd.AddCommand(nodeCmd)
}
