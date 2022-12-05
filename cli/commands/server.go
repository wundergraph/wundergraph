package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path"
	"syscall"

	"github.com/spf13/cobra"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/files"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Subcommand to work with WunderGraph middleware server",
}

var serverStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start runs WunderGraph Server in production mode",
	Long: `
		Example usage:
			wunderctl server start
`,
	Run: func(cmd *cobra.Command, args []string) {
		ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		err := startWunderGraphServer(ctx)
		if err != nil {
			// Exit with error code 1 to indicate failure and restart
			log.Fatal("WunderGraph server process shutdown: %w", zap.Error(err))
		}

		// exit code 0 to indicate success
	},
}

func init() {
	serverCmd.AddCommand(serverStartCmd)
	rootCmd.AddCommand(serverCmd)
}

func startWunderGraphServer(ctx context.Context) error {
	wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
	if err != nil {
		return err
	}

	configFile := path.Join(wunderGraphDir, "generated", configJsonFilename)
	if !files.FileExists(configFile) {
		return fmt.Errorf("could not find configuration file: %s", configFile)
	}

	serverScriptFile := path.Join("generated", "bundle", "server.js")
	serverExecutablePath := path.Join(wunderGraphDir, serverScriptFile)
	if !files.FileExists(serverExecutablePath) {
		return fmt.Errorf(`hooks server executable "%s" not found`, serverExecutablePath)
	}

	srvCfg := &helpers.ServerRunConfig{
		WunderGraphDirAbs: wunderGraphDir,
		ServerScriptFile:  serverScriptFile,
		Production:        true,
		Env:               helpers.CliEnv(rootFlags),
	}

	hookServerRunner := helpers.NewServerRunner(log, srvCfg)

	<-hookServerRunner.Run(ctx)

	return hookServerRunner.Error()
}
