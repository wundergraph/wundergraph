package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path"
	"syscall"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/runners"
	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/files"
)

var (
	excludeServer              bool
	disableForceHttpsRedirects bool
	enableIntrospection        bool
	gracefulTimeout            int
	configJsonFilename         string
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start runs WunderGraph in production mode",
	Long: `Running WunderGraph in production mode means,
no code generation, no directory watching, no config updates,
just running the engine as efficiently as possible without the dev overhead.

If used without --exclude-server, make sure the server is available in this directory:
{entrypoint}/bundle/server.js or override it with --server-entrypoint.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		entryPoints, err := files.GetWunderGraphEntryPoints(wundergraphDir, configEntryPointFilename, serverEntryPointFilename)
		if err != nil {
			return fmt.Errorf("could not find file or directory: %s", err)
		}

		configFile := path.Join(entryPoints.WunderGraphDirAbs, "generated", configJsonFilename)
		if !files.FileExists(configFile) {
			return fmt.Errorf("could not find configuration file: %s", configFile)
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		quit := make(chan os.Signal, 2)
		signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

		secret, err := apihandler.GenSymmetricKey(64)
		if err != nil {
			return err
		}

		hooksJWT, err := apihandler.CreateHooksJWT(secret)
		if err != nil {
			return err
		}

		if !excludeServer {
			serverScriptFile := path.Join("generated", "bundle", "server.js")
			serverExecutablePath := path.Join(entryPoints.WunderGraphDirAbs, "generated", "bundle", "server.js")
			if !files.FileExists(serverExecutablePath) {
				return fmt.Errorf(`hooks server build artifact "%s" not found. Please use --exclude-server to disable the server`, path.Join(wundergraphDir, serverScriptFile))
			}

			srvCfg := &runners.ServerRunConfig{
				EnableDebugMode:      enableDebugMode,
				WunderGraphDirAbs:    entryPoints.WunderGraphDirAbs,
				HooksJWT:             hooksJWT,
				MiddlewareListenPort: middlewareListenPort,
				ListenAddr:           listenAddr,
				ServerScriptFile:     serverScriptFile,
			}

			hookServerRunner := runners.NewServerRunner(log, srvCfg)
			defer func() {
				log.Debug("Stopping hooks-server-runner server after WunderNode shutdown")
				err := hookServerRunner.Stop()
				if err != nil {
					log.Error("Stopping hooks-server-runner failed",
						abstractlogger.String("runnerName", "hooks-server-runner"),
						abstractlogger.Error(err),
					)
				}
			}()

			go func() {
				<-hookServerRunner.Run(ctx)
				log.Error("Hook server excited. Initialize WunderNode shutdown")
				// cancel context when hook server stopped
				cancel()
			}()
		}

		nodeRunCfg := &runners.NodeRunConfig{
			BuildInfo:                  BuildInfo,
			HooksSecret:                secret,
			ConfigFilePath:             configFile,
			GracefulTimeoutSeconds:     gracefulTimeout,
			DisableForceHttpsRedirects: disableForceHttpsRedirects,
			EnableIntrospection:        enableIntrospection,
			GitHubAuthDemo:             GitHubAuthDemo,
		}
		nodeRunner := runners.NewNodeRunner(log)

		return nodeRunner.Run(ctx, nodeRunCfg)
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().StringVar(&listenAddr, "listen-addr", "localhost:9991", "listen-addr is the host:port combination, WunderGraph should listen on.")
	startCmd.Flags().StringVarP(&configJsonFilename, "config", "c", "wundergraph.config.json", "filename to the generated wundergraph config")
	startCmd.Flags().IntVar(&middlewareListenPort, "middleware-listen-port", 9992, "middleware-listen-port is the port which the WunderGraph middleware will bind to")
	startCmd.Flags().IntVar(&gracefulTimeout, "graceful-timeout", 10, "graceful-timeout is the time in seconds the server has to graceful shutdown")
	startCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "starts the engine without the server")
	startCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "enables GraphQL introspection on /%api%/%main%/graphql")
	startCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "disables authentication to enforce https redirects")
	startCmd.Flags().StringVar(&configEntryPointFilename, "entrypoint", "wundergraph.config.ts", "filename of node config")
	startCmd.Flags().StringVar(&serverEntryPointFilename, "serverEntryPoint", "wundergraph.server.ts", "filename of the server config")
}
