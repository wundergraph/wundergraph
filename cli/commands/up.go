package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path"
	"path/filepath"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/apihandler"

	"github.com/wundergraph/wundergraph/pkg/bundleconfig"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/wundernodeconfig"
)

var (
	wunderGraphConfigFile string
	listenAddr            string
	middlewareListenPort  int
	entryPoint            string
	serverEntryPoint      string
)

// upCmd represents the up command
var upCmd = &cobra.Command{
	Use:   "up",
	Short: "Start the WunderGraph application in the current dir",
	Long:  `Make sure wundergraph.config.json is present or set the flag accordingly`,
	RunE: func(cmd *cobra.Command, args []string) error {
		secret, err := apihandler.GenSymmetricKey(64)
		if err != nil {
			return err
		}

		hooksJWT, err := apihandler.CreateHooksJWT(secret)
		if err != nil {
			return err
		}

		onFirstRunChan := make(chan struct{})

		log.Info("starting WunderNode",
			abstractlogger.String("version", BuildInfo.Version),
			abstractlogger.String("commit", BuildInfo.Commit),
			abstractlogger.String("date", BuildInfo.Date),
			abstractlogger.String("builtBy", BuildInfo.BuiltBy),
		)
		configBundler, err := bundleconfig.NewBundler("config", bundleconfig.Config{
			EntryPoint: entryPoint,
			WatchPaths: []string{
				path.Join(wundergraphDir, "operations"),
			},
			BlockOnBuild: true,
			IgnorePaths: []string{
				"generated",
				"node_modules",
			},
			OutFile: path.Join(wundergraphDir, "generated", "bundle", "config.js"),
			ScriptEnv: append(os.Environ(),
				fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
				fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
			),
			OnFirstRun:                  onFirstRunChan,
			EnableProcessEnvUsagePlugin: true,
		}, log)
		if err != nil {
			return err
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		go configBundler.Run()

		<-onFirstRunChan

		wd, err := os.Getwd()
		if err != nil {
			log.Fatal("could not get your current working directory")
		}

		hooksBundler, err := bundleconfig.NewBundler("server", bundleconfig.Config{
			EntryPoint: serverEntryPoint,
			WatchPaths: []string{
				// the server relies on wundergraph.config.json
				// the file is produced by the config bundler
				filepath.Join(wundergraphDir, "generated", "wundergraph.config.json"),
			},
			IgnorePaths:           []string{"node_modules"},
			SkipWatchOnEntryPoint: true, // the config bundle is already listening on all import paths
			OutFile:               path.Join(wundergraphDir, "generated", "bundle", "server.js"),
			ScriptEnv: append(os.Environ(),
				"START_HOOKS_SERVER=true",
				fmt.Sprintf("WG_ABS_DIR=%s", filepath.Join(wd, wundergraphDir)),
				fmt.Sprintf("HOOKS_TOKEN=%s", hooksJWT),
				fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
				fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
			),
		}, log)
		if err != nil {
			return err
		}
		go hooksBundler.Run()

		quit := make(chan os.Signal, 1)
		signal.Notify(quit, os.Interrupt)

		cfg := &wundernodeconfig.Config{
			Server: &wundernodeconfig.ServerConfig{
				ListenAddr: listenAddr,
			},
		}
		n := node.New(ctx, BuildInfo, cfg, log)
		go func() {
			err := n.StartBlocking(
				node.WithFileSystemConfig(wunderGraphConfigFile),
				node.WithDebugMode(enableDebugMode),
				node.WithInsecureCookies(),
				node.WithHooksSecret(secret),
				node.WithIntrospection(true),
				node.WithGitHubAuthDemo(GitHubAuthDemo),
			)
			if err != nil {
				log.Fatal("startBlocking", abstractlogger.Error(err))
			}
		}()
		<-quit

		log.Info("shutting down WunderNode ...")

		configBundler.Stop(ctx)

		log.Debug("shutting down hook server ...")
		hooksBundler.Stop(ctx)
		log.Debug("hook server shutdown complete")

		fmt.Println("WunderNode stopped")

		err = n.Shutdown(ctx)
		if err != nil {
			log.Error("error during wunderNode shutdown", abstractlogger.Error(err))
		}

		log.Info("wunderNode shutdown complete")

		return nil
	},
}

func init() {
	rootCmd.AddCommand(upCmd)
	upCmd.Flags().StringVar(&listenAddr, "listen-addr", "localhost:9991", "listen_addr is the host:port combination, WunderGraph should listen on.")
	upCmd.Flags().IntVar(&middlewareListenPort, "middleware-listen-port", 9992, "middleware-listen-port is the port which the WunderGraph middleware will bind to")
	upCmd.Flags().StringVar(&entryPoint, "entrypoint", "wundergraph.config.ts", "entrypoint to build the config")
	upCmd.Flags().StringVar(&serverEntryPoint, "serverEntryPoint", "wundergraph.server.ts", "entrypoint to build the server config")
}
