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
	"golang.org/x/sync/errgroup"

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
		sigCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		g, ctx := errgroup.WithContext(sigCtx)

		n, err := NewWunderGraphNode(ctx)
		if err != nil {
			return err
		}

		g.Go(func() error {
			err := StartWunderGraphNode(n)
			if err != nil {
				log.Error("Start node", abstractlogger.Error(err))
			}
			return err
		})

		n.HandleGracefulShutdown(gracefulTimeout)

		return nil
	},
}

func init() {
	nodeCmd.AddCommand(nodeStartCmd)
	rootCmd.AddCommand(nodeCmd)
}

func NewWunderGraphNode(ctx context.Context) (*node.Node, error) {
	wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
	if err != nil {
		return nil, err
	}

	return node.New(ctx, BuildInfo, wunderGraphDir, log), nil
}

func StartWunderGraphNode(n *node.Node) error {
	configFile := path.Join(n.WundergraphDir, "generated", configJsonFilename)
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

	err = n.StartBlocking(
		node.WithStaticWunderNodeConfig(wunderNodeConfig),
		node.WithDebugMode(enableDebugMode),
	)
	if err != nil {
		return err
	}

	return nil
}
