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
	"time"

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
			err := StartWunderGraphNode(n, stop)
			if err != nil {
				log.Error("Start node", abstractlogger.Error(err))
			}
			return err
		})

		n.HandleGracefulShutdown(gracefulTimeout)

		if err := g.Wait(); err != nil {
			return fmt.Errorf("WunderGraph process shutdown: %w", err)
		}

		return nil
	},
}

func init() {
	nodeCmd.AddCommand(nodeStartCmd)
	rootCmd.AddCommand(nodeCmd)

	nodeStartCmd.Flags().IntVar(&shutdownAfterIdle, "shutdown-after-idle", 0, "shuts down the server after given seconds in idle when no requests have been served")
}

func NewWunderGraphNode(ctx context.Context) (*node.Node, error) {
	wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
	if err != nil {
		return nil, err
	}

	return node.New(ctx, BuildInfo, wunderGraphDir, log), nil
}

func StartWunderGraphNode(n *node.Node, stop func()) error {
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

	wunderNodeConfig, err := node.CreateConfig(&graphConfig)
	if err != nil {
		log.Error("Failed to create config", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
		return err
	}

	opts := []node.Option{
		node.WithStaticWunderNodeConfig(wunderNodeConfig),
		node.WithDebugMode(rootFlags.DebugMode),
	}

	if shutdownAfterIdle > 0 {
		opts = append(opts, node.WithIdleTimeout(time.Duration(shutdownAfterIdle)*time.Second, func() {
			log.Info("shutting down due to idle timeout")
			stop()
		}))
	}

	err = n.StartBlocking(opts...)
	if err != nil {
		return err
	}

	return nil
}
