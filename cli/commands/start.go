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

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
)

var (
	excludeServer              bool
	disableForceHttpsRedirects bool
	enableIntrospection        bool
	gracefulTimeout            int
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
		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}

		configFile := path.Join(wunderGraphDir, "generated", configJsonFilename)
		if !files.FileExists(configFile) {
			return fmt.Errorf("could not find configuration file: %s", configFile)
		}

		nodeCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		if !excludeServer {
			serverCtx, cancel := context.WithCancel(context.Background())
			defer cancel()

			serverScriptFile := path.Join("generated", "bundle", "server.js")
			serverExecutablePath := path.Join(wunderGraphDir, "generated", "bundle", "server.js")
			if !files.FileExists(serverExecutablePath) {
				return fmt.Errorf(`hooks server build artifact "%s" not found. Please use --exclude-server to disable the server`, path.Join(wunderGraphDir, serverScriptFile))
			}

			srvCfg := &helpers.ServerRunConfig{
				WunderGraphDirAbs: wunderGraphDir,
				ServerScriptFile:  serverScriptFile,
				Production:        true,
				Env:               helpers.CliEnv(cliLogLevel, prettyLogging),
			}

			hookServerRunner := helpers.NewServerRunner(log, srvCfg)

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
				<-hookServerRunner.Run(serverCtx)
				if err := nodeCtx.Err(); err != nil {
					log.Info("WunderGraph Server shutdown complete.")
				} else {
					log.Error("Hook server excited. Initialize WunderNode shutdown")
					stop()
				}
			}()
		}

		configFileChangeChan := make(chan struct{})
		n := node.New(nodeCtx, BuildInfo, wunderGraphDir, log)

		go func() {
			err := n.StartBlocking(
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
				node.WithDebugMode(enableDebugMode),
				node.WithForceHttpsRedirects(!disableForceHttpsRedirects),
				node.WithIntrospection(enableIntrospection),
				node.WithGitHubAuthDemo(GitHubAuthDemo),
			)
			if err != nil {
				log.Fatal("startBlocking", abstractlogger.Error(err))
			}
		}()

		// trigger server reload after initial config build
		// because no fs event is fired as build is already done
		configFileChangeChan <- struct{}{}

		n.HandleGracefulShutdown(gracefulTimeout)

		return nil
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().IntVar(&gracefulTimeout, "graceful-timeout", 10, "graceful-timeout is the time in seconds the server has to graceful shutdown")
	startCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "starts the engine without the server")
	startCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "enables GraphQL introspection on /%api%/%main%/graphql")
	startCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "disables authentication to enforce https redirects")
}
