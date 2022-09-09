package commands

import (
	"context"
	"fmt"
	"path"

	"github.com/jensneuse/abstractlogger"
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

		if enableDebugMode {
			if port, err := helpers.ServerPortFromConfig(configFile); err != nil {
				log.Fatal("could not read server port from config file", abstractlogger.String("configFile", configFile))
			} else {
				helpers.KillExistingHooksProcess(port, log)
			}
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		srvCfg := &helpers.ServerRunConfig{
			WunderGraphDirAbs: wgDir,
			ServerScriptFile:  serverScriptFile,
			Production:        true,
		}

		hookServerRunner := helpers.NewServerRunner(log, srvCfg)

		<-hookServerRunner.Run(ctx)
		log.Error("Hook server excited")

		return nil
	},
}

func init() {
	serverCmd.AddCommand(serverStartCmd)
	rootCmd.AddCommand(serverCmd)
}
