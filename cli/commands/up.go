package commands

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path"
	"runtime"
	"sync"
	"syscall"

	"github.com/wundergraph/wundergraph/cli/runners"
	"github.com/wundergraph/wundergraph/pkg/webhooks"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/bundler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/watcher"
	"github.com/wundergraph/wundergraph/pkg/wundernodeconfig"
)

var (
	nodeListenAddr          string
	serverHost              string
	serverListenPort        int
	clearIntrospectionCache bool
)

const (
	NodeListenAddrFlagName       = "listen-addr"
	MiddlewareListenPortFlagName = "middleware-listen-port"
	ServerHostFlagName           = "server-host"
	ServerListenPortFlagName     = "server-listen-port"
)

// upCmd represents the up command
var upCmd = &cobra.Command{
	Use:   "up",
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

		quit := make(chan os.Signal, 2)
		signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

		ctx, cancel := context.WithCancel(context.Background())
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

		wgEnvVars := append(os.Environ(),
			fmt.Sprintf("WG_SERVER_PORT=%d", serverListenPort),
			fmt.Sprintf("WG_SERVER_HOST=%s", serverHost),
			fmt.Sprintf("WG_NODE_URL=%s", fmt.Sprintf("http://%s", nodeListenAddr)),
		)

		configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-runner",
			Executable:    "node",
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			ScriptEnv: append(wgEnvVars,
				"WG_ENABLE_INTROSPECTION_CACHE=true",
			),
		})

		// responsible for executing the config in "polling" mode
		configIntrospectionRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-introspection-runner",
			Executable:    "node",
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			ScriptEnv: append(wgEnvVars,
				// this environment variable starts the config runner in "Polling Mode"
				"WG_DATA_SOURCE_POLLING_MODE=true",
			),
		})

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
				WatchPaths: []*watcher.WatchPath{
					{Path: configJsonPath},
				},
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

			srvCfg := &runners.ServerRunConfig{
				EnableDebugMode:   enableDebugMode,
				WunderGraphDirAbs: entryPoints.WunderGraphDirAbs,
				ServerListenPort:  serverListenPort,
				ServerHost:        serverHost,
				NodeUrl:           fmt.Sprintf("http://%s", nodeListenAddr),
				ServerScriptFile:  serverOutFile,
			}

			hookServerRunner := runners.NewServerRunner(log, srvCfg)

			onAfterBuild = func() {
				log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))

				// generate new config
				<-configRunner.Run(ctx)

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
					<-hookServerRunner.Run(ctx)
				}()

				go func() {
					// run or restart the introspection poller
					<-configIntrospectionRunner.Run(ctx)
				}()
			}
		} else {
			_, _ = white.Printf("Hooks EntryPoint not found, skipping. File: %s\n", serverEntryPointFilename)
			onAfterBuild = func() {
				log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))

				// generate new config
				<-configRunner.Run(ctx)

				go func() {
					// run or restart the introspection poller
					<-configIntrospectionRunner.Run(ctx)
				}()
			}
		}

		configBundler := bundler.NewBundler(bundler.Config{
			Name:          "config-bundler",
			EntryPoints:   []string{configEntryPointFilename},
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			OutFile:       configOutFile,
			Logger:        log,
			WatchPaths: []*watcher.WatchPath{
				{Path: path.Join(entryPoints.WunderGraphDirAbs, "operations"), Optional: true},
				{Path: path.Join(entryPoints.WunderGraphDirAbs, "fragments"), Optional: true},
				// all webhook filenames are stored in the config
				// we are going to create HTTP routes on the node for all of them
				{Path: webhooksDir, Optional: true},
				// a new cache entry is generated as soon as the introspection "poller" detects a change in the API dependencies
				// in that case we want to rerun the script to build a new config
				{Path: introspectionCacheDir},
			},
			IgnorePaths: []string{
				"node_modules",
			},
			OnAfterBundle: onAfterBuild,
		})

		configBundler.Bundle()

		// only start watching in the builder once the initial config was built and written to the filesystem
		go configBundler.Watch(ctx)

		configFileChangeChan := make(chan struct{})
		configWatcher := watcher.NewWatcher("config", &watcher.Config{
			WatchPaths: []*watcher.WatchPath{
				{Path: configJsonPath},
			},
		}, log)

		go func() {
			err := configWatcher.Watch(ctx, func(paths []string) error {
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
				ListenAddr: nodeListenAddr,
			},
		}
		n := node.New(ctx, BuildInfo, cfg, log)
		go func() {
			configFile := path.Join(entryPoints.WunderGraphDirAbs, "generated", "wundergraph.config.json")
			err := n.StartBlocking(
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
				node.WithDebugMode(enableDebugMode),
				node.WithInsecureCookies(),
				node.WithIntrospection(true),
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

		select {
		case signal := <-quit:
			log.Info("Received interrupt signal. Initialize WunderNode shutdown ...",
				abstractlogger.String("signal", signal.String()),
			)
		case <-ctx.Done():
			log.Info("Context was canceled. Initialize WunderNode shutdown ....")
		}

		configRunner.Stop()
		configIntrospectionRunner.Stop()
		if hookServerRunner != nil {
			hookServerRunner.Stop()
		}

		err = n.Close()
		if err != nil {
			log.Error("Error during WunderNode close", abstractlogger.Error(err))
		}

		log.Info("WunderNode shutdown complete")

		return nil
	},
}

func init() {
	rootCmd.AddCommand(upCmd)
	upCmd.Flags().StringVar(&nodeListenAddr, NodeListenAddrFlagName, "localhost:9991", fmt.Sprintf("%s is the host:port combination, WunderGraph should listen on.", NodeListenAddrFlagName))
	upCmd.Flags().IntVar(&serverListenPort, MiddlewareListenPortFlagName, 9992, fmt.Sprintf("%s is the port which the WunderGraph middleware will bind to", MiddlewareListenPortFlagName))
	upCmd.Flags().IntVar(&serverListenPort, ServerListenPortFlagName, 9992, fmt.Sprintf("%s is the port which the WunderGraph middleware will bind to", ServerListenPortFlagName))
	upCmd.Flags().StringVar(&serverHost, ServerHostFlagName, "127.0.0.1", fmt.Sprintf("%s is the host which the WunderGraph middleware will bind to", ServerHostFlagName))
	upCmd.Flags().BoolVar(&clearIntrospectionCache, "clear-introspection-cache", false, "clears the introspection cache")
	upCmd.Flags().StringVarP(&configJsonFilename, "config", "c", "wundergraph.config.json", "filename to the generated wundergraph config")
	upCmd.Flags().StringVar(&configEntryPointFilename, "entrypoint", "wundergraph.config.ts", "entrypoint to build the config")
	upCmd.Flags().StringVar(&serverEntryPointFilename, "serverEntryPoint", "wundergraph.server.ts", "entrypoint to build the server config")

	_ = upCmd.Flags().MarkDeprecated(MiddlewareListenPortFlagName, fmt.Sprintf("%s is deprecated please use %s instead", MiddlewareListenPortFlagName, ServerListenPortFlagName))
}

func killExistingHooksProcess() {
	if runtime.GOOS == "windows" {
		command := fmt.Sprintf("(Get-NetTCPConnection -LocalPort %d).OwningProcess -Force", serverListenPort)
		execCmd(exec.Command("Stop-Process", "-Id", command))
	} else {
		command := fmt.Sprintf("lsof -i tcp:%d | grep LISTEN | awk '{print $2}' | xargs kill -9", serverListenPort)
		execCmd(exec.Command("bash", "-c", command))
	}
}

func execCmd(cmd *exec.Cmd) {
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
			abstractlogger.String("host", serverHost),
			abstractlogger.Int("port", serverListenPort),
		)
	}
}
