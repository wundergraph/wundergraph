package commands

import (
	"context"
	"fmt"
	"path"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/runners"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/wundernodeconfig"
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
		wgDir, err := files.FindWunderGraphDir(wundergraphDir)
		if err != nil {
			return err
		}

		configFile := path.Join(wgDir, "generated", configJsonFilename)
		if !files.FileExists(configFile) {
			return fmt.Errorf("could not find configuration file: %s", configFile)
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		if !excludeServer {
			serverScriptFile := path.Join("generated", "bundle", "server.js")
			serverExecutablePath := path.Join(wgDir, "generated", "bundle", "server.js")
			if !files.FileExists(serverExecutablePath) {
				return fmt.Errorf(`hooks server build artifact "%s" not found. Please use --exclude-server to disable the server`, path.Join(wgDir, serverScriptFile))
			}

			srvCfg := &runners.ServerRunConfig{
				EnableDebugMode:   enableDebugMode,
				WunderGraphDirAbs: wgDir,
				ServerListenPort:  serverListenPort,
				ServerHost:        serverHost,
				NodeUrl:           fmt.Sprintf("http://%s", nodeListenAddr),
				ServerScriptFile:  serverScriptFile,
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

		shutdownHandler := runners.NewNodeShutdownHandler(log, gracefulTimeout)

		cfg := &wundernodeconfig.Config{
			Server: &wundernodeconfig.ServerConfig{
				ListenAddr: nodeListenAddr,
			},
		}

		configFileChangeChan := make(chan struct{})
		n := node.New(ctx, BuildInfo, cfg, log)

		go func() {
			err := n.StartBlocking(
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
				node.WithDebugMode(enableDebugMode),
				node.WithForceHttpsRedirects(!disableForceHttpsRedirects),
				node.WithIntrospection(enableIntrospection),
				node.WithGitHubAuthDemo(GitHubAuthDemo),
				node.WithHooksServerUrl(fmt.Sprintf("http://%s:%d", serverHost, serverListenPort)),
			)
			if err != nil {
				log.Fatal("startBlocking", abstractlogger.Error(err))
			}
		}()

		// trigger server reload after initial config build
		// because no fs event is fired as build is already done
		configFileChangeChan <- struct{}{}

		shutdownHandler.HandleGracefulShutdown(ctx, n)

		return nil
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().StringVar(&nodeListenAddr, NodeListenAddrFlagName, "localhost:9991", fmt.Sprintf("%s is the host:port combination, WunderGraph should listen on.", NodeListenAddrFlagName))
	startCmd.Flags().IntVar(&serverListenPort, MiddlewareListenPortFlagName, 9992, fmt.Sprintf("%s is the port which the WunderGraph middleware will bind to", MiddlewareListenPortFlagName))
	startCmd.Flags().IntVar(&serverListenPort, ServerListenPortFlagName, 9992, fmt.Sprintf("%s is the port which the WunderGraph middleware will bind to", ServerListenPortFlagName))
	startCmd.Flags().StringVar(&serverHost, ServerHostFlagName, "127.0.0.1", fmt.Sprintf("%s is the host which the WunderGraph middleware will bind to", ServerHostFlagName))
	startCmd.Flags().StringVarP(&configJsonFilename, "config", "c", "wundergraph.config.json", "filename to the generated wundergraph config")
	startCmd.Flags().IntVar(&gracefulTimeout, "graceful-timeout", 10, "graceful-timeout is the time in seconds the server has to graceful shutdown")
	startCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "starts the engine without the server")
	startCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "enables GraphQL introspection on /%api%/%main%/graphql")
	startCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "disables authentication to enforce https redirects")
	startCmd.Flags().StringVar(&configEntryPointFilename, "entrypoint", "wundergraph.config.ts", "entrypoint to the node config")
	startCmd.Flags().StringVar(&serverEntryPointFilename, "serverEntryPoint", "wundergraph.server.ts", "entrypoint to the server config")

	_ = startCmd.Flags().MarkDeprecated(MiddlewareListenPortFlagName, fmt.Sprintf("%s is deprecated please use %s instead", MiddlewareListenPortFlagName, ServerListenPortFlagName))
}
