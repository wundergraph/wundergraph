package commands

import (
	"context"
	"fmt"
	"path"

	"github.com/kelseyhightower/envconfig"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/runners"
	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/files"
)

type ServerStartSettings struct {
	NodeURL    string `envconfig:"NODE_URL" required:"true"`
	Secret     []byte `envconfig:"SECRET" required:"true"`
	ServerHost string `envconfig:"SERVER_HOST" required:"true"`
	ServerPort int    `envconfig:"SERVER_PORT" required:"true"`
}

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
			SECRET=secret SERVER_PORT=9993 SERVER_HOST=0.0.0.0 NODE_URL=127.0.0.1:9991 wunderctl node start
`,
	RunE: func(cmd *cobra.Command, args []string) error {
		entryPoints, err := files.GetWunderGraphEntryPoints(files.WunderGraphDir, "wundergraph.config.ts", "wundergraph.server.ts")
		if err != nil {
			return fmt.Errorf("could not find file or directory: %s", err)
		}

		serverScriptFile := path.Join("generated", "bundle", "server.js")
		serverExecutablePath := path.Join(entryPoints.WunderGraphDirAbs, "generated", "bundle", "server.js")
		if !files.FileExists(serverExecutablePath) {
			return fmt.Errorf(`hooks server build artifact "%s" not found. Please use --exclude-server to disable the server`, path.Join(wundergraphDir, serverScriptFile))
		}

		var settings ServerStartSettings
		if err := envconfig.Process("", &settings); err != nil {
			return err
		}

		hooksJWT, err := apihandler.CreateHooksJWT(settings.Secret)
		if err != nil {
			return err
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		srvCfg := &runners.ServerRunConfig{
			EnableDebugMode:   enableDebugMode,
			WunderGraphDirAbs: entryPoints.WunderGraphDirAbs,
			HooksJWT:          hooksJWT,
			ServerHost:        settings.ServerHost,
			ServerListenPort:  settings.ServerPort,
			NodeAddr:          settings.NodeURL,
			ServerScriptFile:  serverScriptFile,
		}

		hookServerRunner := runners.NewServerRunner(log, srvCfg)

		<-hookServerRunner.Run(ctx)
		log.Error("Hook server excited")

		return nil
	},
}

func init() {
	serverCmd.AddCommand(serverStartCmd)
	rootCmd.AddCommand(serverCmd)
}
