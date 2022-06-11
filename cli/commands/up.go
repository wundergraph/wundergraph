package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path"
	"path/filepath"
	"syscall"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/bundler"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/watcher"
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

		quit := make(chan os.Signal, 2)
		signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

		hooksJWT, err := apihandler.CreateHooksJWT(secret)
		if err != nil {
			return err
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		log.Info("Starting WunderNode",
			abstractlogger.String("version", BuildInfo.Version),
			abstractlogger.String("commit", BuildInfo.Commit),
			abstractlogger.String("date", BuildInfo.Date),
			abstractlogger.String("builtBy", BuildInfo.BuiltBy),
		)

		configFileChangeChan := make(chan struct{})
		configWatcher := watcher.NewWatcher("config", &watcher.Config{
			WatchPaths: []string{
				filepath.Join(wundergraphDir, "generated", "wundergraph.config.json"),
			},
		}, log)

		go func() {
			err := configWatcher.Watch(ctx, func(paths []string) error {
				configFileChangeChan <- struct{}{}
				return nil
			})
			if err != nil {
				log.Error("watcher",
					abstractlogger.String("watcher", "wundergraph config"),
					abstractlogger.Error(err),
				)
			}
		}()

		configOutFile := path.Join(wundergraphDir, "generated", "bundle", "config.js")
		configBundler := bundler.NewBundler(bundler.Config{
			Name:       "config-bundler",
			EntryPoint: entryPoint,
			OutFile:    configOutFile,
			Logger:     log,
			WatchPaths: []string{
				path.Join(wundergraphDir, "operations"),
			},
			IgnorePaths: []string{
				"generated",
				"node_modules",
			},
		})

		configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:       "config-runner",
			Executable: "node",
			ScriptArgs: []string{configOutFile},
			Logger:     log,
			ScriptEnv: append(os.Environ(),
				fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
				fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
			),
		})
		defer func() {
			log.Debug("Stopping config-runner after WunderNode shutdown")
			err := configRunner.Stop()
			if err != nil {
				log.Error("Stopping runner failed",
					abstractlogger.String("runnerName", "config-runner"),
					abstractlogger.Error(err),
				)
			}
		}()

		go configBundler.Bundle(ctx)

		<-configBundler.BuildDoneChan

		<-configRunner.Run(ctx)

		go func() {
			for {
				select {
				case <-configBundler.BuildDoneChan:
					log.Debug("Configuration change detected")
					<-configRunner.Run(ctx)
				}
			}
		}()

		if _, err := os.Stat(serverEntryPoint); err == nil {
			serverOutFile := path.Join(wundergraphDir, "generated", "bundle", "server.js")
			hooksBundler := bundler.NewBundler(bundler.Config{
				Name:                  "server-bundler",
				EntryPoint:            serverEntryPoint,
				OutFile:               serverOutFile,
				SkipWatchOnEntryPoint: true, // the config bundle is already listening on all import paths
				Logger:                log,
				WatchPaths: []string{
					filepath.Join(wundergraphDir, "generated", "wundergraph.config.json"),
				},
			})

			wd, err := os.Getwd()
			if err != nil {
				log.Fatal("Could not get your current working directory")
			}

			hookServerRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
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
				for {
					select {
					case <-hooksBundler.BuildDoneChan:
						log.Debug("Hook server change detected -> (re-)configuring server\n")
						hookServerRunner.Run(ctx)
					}
				}
			}()

			hooksBundler.Bundle(ctx)
		} else {
			_, _ = white.Printf("Hooks EntryPoint not found, skipping. Source: %s\n", serverEntryPoint)
		}

		cfg := &wundernodeconfig.Config{
			Server: &wundernodeconfig.ServerConfig{
				ListenAddr: listenAddr,
			},
		}
		n := node.New(ctx, BuildInfo, cfg, log)
		go func() {
			err := n.StartBlocking(
				node.WithConfigFileChange(configFileChangeChan),
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

		select {
		case signal := <-quit:
			log.Info("Received interrupt signal. Initialize WunderNode shutdown ...",
				abstractlogger.String("signal", signal.String()),
			)
		case <-ctx.Done():
			log.Info("Context was canceled. Initialize WunderNode shutdown ....")
		}

		log.Info("Shutting down WunderNode ...")

		err = n.Shutdown(ctx)
		if err != nil {
			log.Error("Error during WunderNode shutdown", abstractlogger.Error(err))
		}

		log.Info("WunderNode shutdown complete")

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
