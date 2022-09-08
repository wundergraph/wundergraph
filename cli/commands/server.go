package commands

import (
	"context"
	"fmt"
	"path"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/files"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Subcommand to work with WunderGraph middleware server",
	RunE: func(cmd *cobra.Command, args []string) error {
		return nil
	},
}

var serverStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start runs WunderGraph Middleware in production mode",
	Long: `
		Example usage:
			WG_SECRET=secret WG_SERVER_PORT=9992 WG_SERVER_HOST=127.0.0.1 WG_NODE_URL=http://127.0.0.1:9991 wunderctl server start
`,
	RunE: func(cmd *cobra.Command, args []string) error {
		wgDir, err := files.FindWunderGraphDir(wundergraphDir)
		if err != nil {
			return err
		}

		serverScriptFile := path.Join("generated", "bundle", "server.js")
		serverExecutablePath := path.Join(wgDir, serverScriptFile)
		if !files.FileExists(serverExecutablePath) {
			return fmt.Errorf(`hooks server executable "%s" not found`, serverExecutablePath)
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
