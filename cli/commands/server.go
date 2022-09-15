package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path"
	"syscall"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/files"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Subcommand to work with WunderGraph middleware server",
}

var serverStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start runs WunderGraph Middleware in production mode",
	Long: `
		Example usage:
			wunderctl server start
`,
	RunE: func(cmd *cobra.Command, args []string) error {
		wgDir, err := files.FindWunderGraphDir(wundergraphDir)
		if err != nil {
			return err
		}

		configFile := path.Join(wgDir, "generated", configJsonFilename)
		if !files.FileExists(configFile) {
			return fmt.Errorf("could not find configuration file: %s", configFile)
		}

		serverScriptFile := path.Join("generated", "bundle", "server.js")
		serverExecutablePath := path.Join(wgDir, serverScriptFile)
		if !files.FileExists(serverExecutablePath) {
			return fmt.Errorf(`hooks server executable "%s" not found`, serverExecutablePath)
		}

		ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		srvCfg := &helpers.ServerRunConfig{
			WunderGraphDirAbs: wgDir,
			ServerScriptFile:  serverScriptFile,
			Production:        true,
		}

		hookServerRunner := helpers.NewServerRunner(log, srvCfg)

		<-hookServerRunner.Run(ctx)
		if ctx.Err() != nil {
			log.Info("WunderGraph Server shutdown complete")
		} else {
			log.Error("WunderGraph Server excited")
		}

		return nil
	},
}

func init() {
	serverCmd.AddCommand(serverStartCmd)
	rootCmd.AddCommand(serverCmd)
}
