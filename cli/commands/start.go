package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path"
	"path/filepath"
	"syscall"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/wundernodeconfig"
)

var (
	startServerEntryPoint      string
	excludeServer              bool
	disableForceHttpsRedirects bool
	enableIntrospection        bool
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
			wd, err := os.Getwd()
			if err != nil {
				log.Fatal("could not get your current working directory")
			}

			serverOutFile := path.Join(wundergraphDir, "generated", "bundle", "server.js")
			runner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
				Name:       "hooks-server-runner",
				Executable: "node",
				ScriptArgs: []string{serverOutFile},
				Logger:     log,
				ScriptEnv: append(os.Environ(),
					"START_HOOKS_SERVER=true",
					fmt.Sprintf("WG_ABS_DIR=%s", filepath.Join(wd, wundergraphDir)),
					fmt.Sprintf("HOOKS_TOKEN=%s", hooksJWT),
					fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
					fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
				),
			})
			defer runner.Stop()

			go func() {
				<-runner.Run(ctx)
				log.Error("hook server excited. Initialize WunderNode shutdown")
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
				node.WithFileSystemConfig(wunderGraphConfigFile),
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

		// load config file once
		configFileChangeChan <- struct{}{}

		select {
		case <-quit:
			log.Info("received interrupt signal. Initialize WunderNode shutdown ...")
		case <-ctx.Done():
			log.Info("context was canceled. Initialize WunderNode shutdown ....")
		}

		log.Info("shutting down WunderNode ...")

		ctx, cancel = context.WithTimeout(ctx, 10*time.Second)
		defer cancel()

		err = n.Shutdown(ctx)
		if err != nil {
			log.Error("error during WunderNode shutdown", abstractlogger.Error(err))
		}

		log.Info("WunderNode shutdown complete")

		return nil
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().StringVar(&listenAddr, "listen-addr", "localhost:9991", "listen_addr is the host:port combination, WunderGraph should listen on.")
	startCmd.Flags().IntVar(&middlewareListenPort, "middleware-listen-port", 9992, "middleware-listen-port is the port which the WunderGraph middleware will bind to")
	startCmd.Flags().StringVar(&startServerEntryPoint, "server-entrypoint", "", "entrypoint to start the server")
	startCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "starts the engine without the server")
	startCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "enables GraphQL introspection on /%api%/%main%/graphql")
	startCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "disables authentication to enforce https redirects")
}
