package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path"
	"syscall"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
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
		entryPoints, err := files.GetWunderGraphEntryPoints(wundergraphDir, configEntryPointFilename, serverEntryPointFilename)
		if err != nil {
			log.Fatal(`could not find file or directory`,
				abstractlogger.Error(err),
			)
		}

		configFile := path.Join(entryPoints.WunderGraphDir, "generated", configJsonFilename)
		if !files.FileExists(configFile) {
			log.Fatal(`could not find configuration file`,
				abstractlogger.Error(err),
				abstractlogger.String("file", configFile),
			)
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
			hooksEnv := []string{
				"START_HOOKS_SERVER=true",
				fmt.Sprintf("WG_ABS_DIR=%s", entryPoints.WunderGraphDir),
				fmt.Sprintf("HOOKS_TOKEN=%s", hooksJWT),
				fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
				fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
			}

			if enableDebugMode {
				hooksEnv = append(hooksEnv, "LOG_LEVEL=debug")
			}

			serverOutFile := path.Join("generated", "bundle", "server.js")
			hookServerRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
				Name:          "hooks-server-runner",
				Executable:    "node",
				AbsWorkingDir: entryPoints.WunderGraphDir,
				ScriptArgs:    []string{serverOutFile},
				Logger:        log,
				ScriptEnv:     append(os.Environ(), hooksEnv...),
			})

			defer func() {
				log.Debug("Stopping hooks-server-runner server after WunderNode shutdown")
				err := hookServerRunner.Stop()
				if err != nil {
					log.Error("Stopping runner failed",
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

		cfg := &wundernodeconfig.Config{
			Server: &wundernodeconfig.ServerConfig{
				ListenAddr: listenAddr,
			},
		}

		configFileChangeChan := make(chan struct{})
		n := node.New(ctx, BuildInfo, cfg, log)

		go func() {
			err := n.StartBlocking(
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
				node.WithHooksSecret(secret),
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

		select {
		case signal := <-quit:
			log.Info("Received interrupt signal. Initialize WunderNode shutdown ...",
				abstractlogger.String("signal", signal.String()),
			)
		case <-ctx.Done():
			log.Info("Context was canceled. Initialize WunderNode shutdown ....")
		}

		gracefulTimeoutDur := time.Duration(gracefulTimeout) * time.Second
		log.Info("Graceful shutdown WunderNode ...", abstractlogger.String("gracefulTimeout", gracefulTimeoutDur.String()))
		ctx, cancel = context.WithTimeout(ctx, gracefulTimeoutDur)
		defer cancel()

		err = n.Shutdown(ctx)
		if err != nil {
			log.Error("Error during WunderNode shutdown", abstractlogger.Error(err))
		}

		log.Info("WunderNode shutdown complete")

		return nil
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
