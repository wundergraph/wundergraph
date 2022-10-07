package commands

import (
	"context"
	"encoding/json"
	"errors"
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
		ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		return startWunderGraphNode(ctx, defaultNodeGracefulTimeoutSeconds)
	},
}

func init() {
	nodeCmd.AddCommand(nodeStartCmd)
	rootCmd.AddCommand(nodeCmd)
}

func startWunderGraphNode(ctx context.Context, gracefulTimeoutSeconds int) error {
	wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
	if err != nil {
		return err
	}

	configFile := path.Join(wunderGraphDir, "generated", configJsonFilename)
	if !files.FileExists(configFile) {
		return fmt.Errorf("could not find configuration file: %s", configFile)
	}

	data, err := ioutil.ReadFile(configFile)
	if err != nil {
		log.Error("Failed to read file", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
		return err
	}
	if len(data) == 0 {
		log.Error("Config file is empty", abstractlogger.String("filePath", configFile))
		return errors.New("config file is empty")
	}
	var graphConfig wgpb.WunderGraphConfiguration
	err = json.Unmarshal(data, &graphConfig)
	if err != nil {
		log.Error("Failed to unmarshal", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
		return errors.New("failed to unmarshal config file")
	}

	wunderNodeConfig := node.CreateConfig(&graphConfig)
	n := node.New(ctx, BuildInfo, wunderGraphDir, log)

	go func() {
		err := n.StartBlocking(
			node.WithStaticWunderNodeConfig(wunderNodeConfig),
			node.WithDebugMode(enableDebugMode),
		)
		if err != nil {
			log.Fatal("startBlocking", abstractlogger.Error(err))
		}
	}()

	n.HandleGracefulShutdown(gracefulTimeoutSeconds)

	return nil
}
