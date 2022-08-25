package commands

import (
	"context"
	"fmt"
	"github.com/wundergraph/wundergraph/pkg/webhooks"
	"os"
	"os/signal"
	"path"
	"sync"
	"syscall"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/bundler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/watcher"
	"github.com/wundergraph/wundergraph/pkg/wundernodeconfig"
)

type SDKNode struct {
	Node *node.Node
}

var sdkQuit = make(chan os.Signal, 2)
var sdkCtx = context.Background()
var SdkNode SDKNode

var configRunnerSdk *scriptrunner.ScriptRunner
var configIntrospectionRunnerSdk *scriptrunner.ScriptRunner
var hookServerRunnerSdk *scriptrunner.ScriptRunner

// upCmd represents the up command
var upCmdSDK = &cobra.Command{
	Use:   "upsdk",
	Short: "Start the WunderGraph application in the current dir",
	Long:  `Make sure wundergraph.config.json is present or set the flag accordingly`,
	RunE: func(cmd *cobra.Command, args []string) error {
		entryPoints, err := files.GetWunderGraphEntryPoints(wundergraphDir, configEntryPointFilename, serverEntryPointFilename)
		if err != nil {
			return fmt.Errorf("could not find file or directory: %s", err)
		}

		// some IDEs, like Goland, don't send a SIGINT to the process group
		// this leads to the middleware hooks server (sub-process) not being killed
		// on subsequent runs of the up command, we're not able to listen on the same port
		// so we kill the existing hooks process before we start the new one
		killExistingHooksProcess()

		secret, err := apihandler.GenSymmetricKey(64)
		if err != nil {
			return err
		}

		signal.Notify(sdkQuit, os.Interrupt, syscall.SIGTERM)

		hooksJWT, err := apihandler.CreateHooksJWT(secret)
		if err != nil {
			return err
		}

		ctx, cancel := context.WithCancel(context.Background())
		sdkCtx = ctx
		defer cancel()

		log.Info("Starting WunderNode",
			abstractlogger.String("version", BuildInfo.Version),
			abstractlogger.String("commit", BuildInfo.Commit),
			abstractlogger.String("date", BuildInfo.Date),
			abstractlogger.String("builtBy", BuildInfo.BuiltBy),
		)

		introspectionCacheDir := path.Join(entryPoints.WunderGraphDirAbs, "generated", "introspection", "cache")
		_, errIntrospectionDir := os.Stat(introspectionCacheDir)
		if errIntrospectionDir == nil {
			if clearIntrospectionCache {
				err = os.RemoveAll(introspectionCacheDir)
				if err != nil {
					return err
				}
			}
		}
		err = os.MkdirAll(introspectionCacheDir, os.ModePerm)
		if err != nil {
			return err
		}

		configJsonPath := path.Join(entryPoints.WunderGraphDirAbs, "generated", configJsonFilename)
		webhooksDir := path.Join(entryPoints.WunderGraphDirAbs, webhooks.WebhookDirectoryName)
		configOutFile := path.Join("generated", "bundle", "config.js")
		serverOutFile := path.Join("generated", "bundle", "server.js")
		webhooksOutDir := path.Join("generated", "bundle", "webhooks")

		configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-runner",
			Executable:    "node",
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			ScriptEnv: append(os.Environ(),
				"WG_ENABLE_INTROSPECTION_CACHE=true",
				fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
				fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
			),
		})
		configRunnerSdk = configRunner
		// responsible for executing the config in "polling" mode
		configIntrospectionRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-introspection-runner",
			Executable:    "node",
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			ScriptEnv: append(os.Environ(),
				// this environment variable starts the config runner in "Polling Mode"
				"WG_DATA_SOURCE_POLLING_MODE=true",
				fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
				fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
			),
		})
		configIntrospectionRunnerSdk = configIntrospectionRunner
		var hookServerRunner *scriptrunner.ScriptRunner
		var webhooksBundler *bundler.Bundler
		var onAfterBuild func()

		if entryPoints.ServerEntryPointAbs != "" {
			hooksBundler := bundler.NewBundler(bundler.Config{
				Name:          "hooks-bundler",
				EntryPoints:   []string{serverEntryPointFilename},
				AbsWorkingDir: entryPoints.WunderGraphDirAbs,
				OutFile:       serverOutFile,
				Logger:        log,
				WatchPaths:    []string{configJsonPath},
			})

			if files.DirectoryExists(webhooksDir) {
				webhookPaths, err := webhooks.GetWebhooks(entryPoints.WunderGraphDirAbs)
				if err != nil {
					return err
				}

				webhooksBundler = bundler.NewBundler(bundler.Config{
					Name:          "webhooks-bundler",
					EntryPoints:   webhookPaths,
					AbsWorkingDir: entryPoints.WunderGraphDirAbs,
					OutDir:        webhooksOutDir,
					Logger:        log,
					OnAfterBundle: func() {
						log.Debug("Webhooks bundled!", abstractlogger.String("bundlerName", "webhooks-bundler"))
					},
				})
			}

			hooksEnv := []string{
				"START_HOOKS_SERVER=true",
				fmt.Sprintf("WG_ABS_DIR=%s", entryPoints.WunderGraphDirAbs),
				fmt.Sprintf("HOOKS_TOKEN=%s", hooksJWT),
				fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
				fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
			}

			if enableDebugMode {
				hooksEnv = append(hooksEnv, "LOG_LEVEL=debug")
			}

			hookServerRunner = scriptrunner.NewScriptRunner(&scriptrunner.Config{
				Name:          "hooks-server-runner",
				Executable:    "node",
				AbsWorkingDir: entryPoints.WunderGraphDirAbs,
				ScriptArgs:    []string{serverOutFile},
				Logger:        log,
				ScriptEnv:     append(os.Environ(), hooksEnv...),
			})
			hookServerRunnerSdk = hookServerRunner
			onAfterBuild = func() {
				log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))

				// generate new config
				<-configRunnerSdk.Run(sdkCtx)

				var wg sync.WaitGroup

				wg.Add(1)
				go func() {
					defer wg.Done()
					// bundle hooks
					hooksBundler.Bundle()
				}()

				if webhooksBundler != nil {
					wg.Add(1)
					go func() {
						defer wg.Done()
						webhooksBundler.Bundle()
					}()
				}

				wg.Wait()

				go func() {
					// run or restart hook server
					<-hookServerRunnerSdk.Run(sdkCtx)
				}()

				go func() {
					// run or restart the introspection poller
					<-configIntrospectionRunnerSdk.Run(sdkCtx)
				}()
			}
		} else {
			_, _ = white.Printf("Hooks EntryPoint not found, skipping. File: %s\n", serverEntryPointFilename)
			onAfterBuild = func() {
				log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))

				// generate new config
				<-configRunnerSdk.Run(sdkCtx)

				go func() {
					// run or restart the introspection poller
					<-configIntrospectionRunnerSdk.Run(sdkCtx)
				}()
			}
		}

		configBundler := bundler.NewBundler(bundler.Config{
			Name:          "config-bundler",
			EntryPoints:   []string{configEntryPointFilename},
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			OutFile:       configOutFile,
			Logger:        log,
			WatchPaths: []string{
				path.Join(entryPoints.WunderGraphDirAbs, "operations"),
				path.Join(entryPoints.WunderGraphDirAbs, "fragments"),
				// all webhook filenames are stored in the config
				// we are going to create HTTP routes on the node for all of them
				webhooksDir,
				// a new cache entry is generated as soon as the introspection "poller" detects a change in the API dependencies
				// in that case we want to rerun the script to build a new config
				introspectionCacheDir,
			},
			IgnorePaths: []string{
				"node_modules",
			},
			OnAfterBundle: onAfterBuild,
		})

		configBundler.Bundle()

		// only start watching in the builder once the initial config was built and written to the filesystem
		go configBundler.Watch(sdkCtx)

		configFileChangeChan := make(chan struct{})
		configWatcher := watcher.NewWatcher("config", &watcher.Config{
			WatchPaths: []string{
				configJsonPath,
			},
		}, log)

		go func() {
			err := configWatcher.Watch(sdkCtx, func(paths []string) error {
				configFileChangeChan <- struct{}{}
				return nil
			})
			if err != nil {
				log.Error("watcher",
					abstractlogger.String("watcher", "config"),
					abstractlogger.Error(err),
				)
			}
		}()

		cfg := &wundernodeconfig.Config{
			Server: &wundernodeconfig.ServerConfig{
				ListenAddr: listenAddr,
			},
		}

		n := node.New(sdkCtx, BuildInfo, cfg, log)
		SdkNode = SDKNode{Node: n}
		go func() {
			configFile := path.Join(entryPoints.WunderGraphDirAbs, "generated", "wundergraph.config.json")
			err := SdkNode.Node.StartBlocking(
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
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

		// trigger server reload after initial config build
		// because no fs event is fired as build is already done
		configFileChangeChan <- struct{}{}

		select {
		case signal := <-sdkQuit:
			log.Info("Received interrupt signal. Initialize WunderNode shutdown ...",
				abstractlogger.String("signal", signal.String()),
			)
		case <-sdkCtx.Done():
			log.Info("Context was canceled. Initialize WunderNode shutdown ....")
		}

		configRunnerSdk.Stop()
		configIntrospectionRunnerSdk.Stop()
		if hookServerRunnerSdk != nil {
			hookServerRunnerSdk.Stop()
		}

		err = SdkNode.Node.Close()
		if err != nil {
			log.Error("Error during WunderNode close", abstractlogger.Error(err))
		}

		log.Info("WunderNode shutdown complete")

		return nil
	},
}

func init() {
	rootCmd.AddCommand(upCmdSDK)
	upCmdSDK.Flags().StringVar(&listenAddr, "listen-addr", "localhost:9991", "listen_addr is the host:port combination, WunderGraph should listen on.")
	upCmdSDK.Flags().IntVar(&middlewareListenPort, "middleware-listen-port", 9992, "middleware-listen-port is the port which the WunderGraph middleware will bind to")
	upCmdSDK.Flags().BoolVar(&clearIntrospectionCache, "clear-introspection-cache", false, "clears the introspection cache")
	upCmdSDK.Flags().StringVarP(&configJsonFilename, "config", "c", "wundergraph.config.json", "filename to the generated wundergraph config")
	upCmdSDK.Flags().StringVar(&configEntryPointFilename, "entrypoint", "wundergraph.config.ts", "entrypoint to build the config")
	upCmdSDK.Flags().StringVar(&serverEntryPointFilename, "serverEntryPoint", "wundergraph.server.ts", "entrypoint to build the server config")
}

/*func execCmd(cmd *exec.Cmd) {
	var waitStatus syscall.WaitStatus
	if err := cmd.Run(); err != nil {
		if err != nil {
			os.Stderr.WriteString(fmt.Sprintf("Error: %s\n", err.Error()))
		}
		if exitError, ok := err.(*exec.ExitError); ok {
			waitStatus = exitError.Sys().(syscall.WaitStatus)
			log.Debug(fmt.Sprintf("Error during port killing (exit code: %s)\n", []byte(fmt.Sprintf("%d", waitStatus.ExitStatus()))))
		}
	} else {
		waitStatus = cmd.ProcessState.Sys().(syscall.WaitStatus)
		log.Debug("Successfully killed existing middleware process",
			abstractlogger.Int("port", middlewareListenPort),
		)
	}
}*/
