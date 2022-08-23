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

var nodeCmd = &cobra.Command{
	Use:   "node",
	Short: "",
	Long:  ``,
	RunE: func(cmd *cobra.Command, args []string) error {
		return nil
	},
}

var nodeStartCmd = &cobra.Command{
	Use:   "start",
	Short: "",
	Long:  ``,
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

		shutdownHandler := runners.NewNodeShutdownHandler(log, gracefulTimeout)

		cfg := &wundernodeconfig.Config{
			Server: &wundernodeconfig.ServerConfig{
				ListenAddr: listenAddr,
			},
		}

		n := node.New(ctx, BuildInfo, cfg, log)

		go func() {
			err := n.StartBlocking(
				node.WithFileSystemConfig(configFile),
				node.WithHooksSecret(secret),
				node.WithDebugMode(enableDebugMode),
				node.WithForceHttpsRedirects(!disableForceHttpsRedirects),
				node.WithIntrospection(false),
			)
			if err != nil {
				log.Fatal("startBlocking", abstractlogger.Error(err))
			}
		}()

		shutdownHandler.HandleGracefulShutdown(ctx, n)

		return nil
	},
}

func init() {
	nodeCmd.AddCommand(nodeStartCmd)
	rootCmd.AddCommand(nodeCmd)

	//	nodeStartCmd.Flags().StringVar(&listenAddr, "listen-addr", "localhost:9991", "listen-addr is the host:port combination, WunderGraph should listen on.")
	//	nodeStartCmd.Flags().StringVarP(&configJsonFilename, "config", "c", "wundergraph.config.json", "filename to the generated wundergraph config")
	//	nodeStartCmd.Flags().IntVar(&middlewareListenPort, "middleware-listen-port", 9992, "middleware-listen-port is the port which the WunderGraph middleware will bind to")
	//	nodeStartCmd.Flags().IntVar(&gracefulTimeout, "graceful-timeout", 10, "graceful-timeout is the time in seconds the server has to graceful shutdown")
	//	nodeStartCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "starts the engine without the server")
	//	nodeStartCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "enables GraphQL introspection on /%api%/%main%/graphql")
	//	nodeStartCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "disables authentication to enforce https redirects")
	//	nodeStartCmd.Flags().StringVar(&configEntryPointFilename, "entrypoint", "wundergraph.config.ts", "filename of node config")
	//	nodeStartCmd.Flags().StringVar(&serverEntryPointFilename, "serverEntryPoint", "wundergraph.server.ts", "filename of the server config")
}
