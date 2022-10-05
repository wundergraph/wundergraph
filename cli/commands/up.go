package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"path"
	"sync"
	"syscall"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/bundler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/watcher"
	"github.com/wundergraph/wundergraph/pkg/webhooks"
)

var (
	clearIntrospectionCache bool
)

// upCmd represents the up command
var upCmd = &cobra.Command{
	Use:   "up",
	Short: "Start the WunderGraph application in the current dir",
	Long:  `Make sure wundergraph.config.json is present or set the flag accordingly`,
	RunE: func(cmd *cobra.Command, args []string) error {

		// only validate if the file exists
		_, err := files.CodeFilePath(WunderGraphDir, configEntryPointFilename)
		if err != nil {
			return err
		}

		// optional, no error check
		codeServerFilePath, _ := files.CodeFilePath(WunderGraphDir, serverEntryPointFilename)

		ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt,
			syscall.SIGHUP,  // process is detached from terminal
			syscall.SIGTERM, // default for kill
			syscall.SIGKILL,
			syscall.SIGQUIT, // ctrl + \
			syscall.SIGINT,  // ctrl+c
		)
		defer stop()

		log.Info("Starting WunderNode",
			abstractlogger.String("version", BuildInfo.Version),
			abstractlogger.String("commit", BuildInfo.Commit),
			abstractlogger.String("date", BuildInfo.Date),
			abstractlogger.String("builtBy", BuildInfo.BuiltBy),
		)

		introspectionCacheDir := path.Join(WunderGraphDir, "generated", "introspection", "cache")
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

		configJsonPath := path.Join(WunderGraphDir, "generated", configJsonFilename)
		webhooksDir := path.Join(WunderGraphDir, webhooks.WebhookDirectoryName)
		configOutFile := path.Join("generated", "bundle", "config.js")
		serverOutFile := path.Join("generated", "bundle", "server.js")
		webhooksOutDir := path.Join("generated", "bundle", "webhooks")

		if port, err := helpers.ServerPortFromConfig(configJsonPath); err == nil {
			helpers.KillExistingHooksProcess(port, log)
		}

		configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-runner",
			Executable:    "node",
			AbsWorkingDir: WunderGraphDir,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			FirstRunEnv: append(os.Environ(),
				// when the user runs `wunderctl up` for the first time, we revalidate the cache
				// so the user can be sure that the introspection is up-to-date. In case of an API is not available
				// we will fall back to the cached introspection (when available)
				"WG_ENABLE_INTROSPECTION_CACHE=false",
				// this option allows us to make different decision for the first run
				// for example, we decide to not use the cache, but we will prefill the cache
				"WG_DEV_FIRST_RUN=true",
				fmt.Sprintf("WG_DIR_ABS=%s", WunderGraphDir),
			),
			ScriptEnv: append(os.Environ(),
				"WG_ENABLE_INTROSPECTION_CACHE=true",
				fmt.Sprintf("WG_DIR_ABS=%s", WunderGraphDir),
			),
		})

		// responsible for executing the config in "polling" mode
		configIntrospectionRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-introspection-runner",
			Executable:    "node",
			AbsWorkingDir: WunderGraphDir,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			ScriptEnv: append(os.Environ(),
				// this environment variable starts the config runner in "Polling Mode"
				"WG_DATA_SOURCE_POLLING_MODE=true",
				fmt.Sprintf("WG_DIR_ABS=%s", WunderGraphDir),
			),
		})

		var hookServerRunner *scriptrunner.ScriptRunner
		var webhooksBundler *bundler.Bundler
		var onAfterBuild func() error

		if codeServerFilePath != "" {
			hooksBundler := bundler.NewBundler(bundler.Config{
				Name:          "hooks-bundler",
				EntryPoints:   []string{serverEntryPointFilename},
				AbsWorkingDir: WunderGraphDir,
				OutFile:       serverOutFile,
				Logger:        log,
				WatchPaths: []*watcher.WatchPath{
					{Path: configJsonPath},
				},
			})

			if files.DirectoryExists(webhooksDir) {
				webhookPaths, err := webhooks.GetWebhooks(WunderGraphDir)
				if err != nil {
					return err
				}

				webhooksBundler = bundler.NewBundler(bundler.Config{
					Name:          "webhooks-bundler",
					EntryPoints:   webhookPaths,
					AbsWorkingDir: WunderGraphDir,
					OutDir:        webhooksOutDir,
					Logger:        log,
					OnAfterBundle: func() error {
						log.Debug("Webhooks bundled!", abstractlogger.String("bundlerName", "webhooks-bundler"))
						return nil
					},
				})
			}

			srvCfg := &helpers.ServerRunConfig{
				WunderGraphDirAbs: WunderGraphDir,
				ServerScriptFile:  serverOutFile,
			}

			hookServerRunner = helpers.NewServerRunner(log, srvCfg)

			onAfterBuild = func() error {
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

				return nil
			}
		} else {
			_, _ = white.Printf("Hooks EntryPoint not found, skipping. File: %s\n", serverEntryPointFilename)
			onAfterBuild = func() error {
				// generate new config
				<-configRunner.Run(ctx)

				go func() {
					// run or restart the introspection poller
					<-configIntrospectionRunner.Run(ctx)
				}()

				log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))

				return nil
			}
		}

		configBundler := bundler.NewBundler(bundler.Config{
			Name:          "config-bundler",
			EntryPoints:   []string{configEntryPointFilename},
			AbsWorkingDir: WunderGraphDir,
			OutFile:       configOutFile,
			Logger:        log,
			WatchPaths: []*watcher.WatchPath{
				{Path: path.Join(WunderGraphDir, "operations"), Optional: true},
				{Path: path.Join(WunderGraphDir, "fragments"), Optional: true},
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

		n := node.New(ctx, BuildInfo, WunderGraphDir, log)
		go func() {
			configFile := path.Join(WunderGraphDir, "generated", "wundergraph.config.json")
			err := n.StartBlocking(
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
				node.WithDebugMode(enableDebugMode),
				node.WithInsecureCookies(),
				node.WithIntrospection(true),
				node.WithGitHubAuthDemo(GitHubAuthDemo),
				node.WithDevMode(),
			)
			if err != nil {
				log.Fatal("startBlocking", abstractlogger.Error(err))
			}
		}()

		// trigger server reload after initial config build
		// because no fs event is fired as build is already done
		configFileChangeChan <- struct{}{}

		<-ctx.Done()
		log.Info("Context was canceled. Initialize WunderNode shutdown ....")

		_ = n.Shutdown(context.Background())

		log.Info("WunderNode shutdown complete")

		return nil
	},
}

func init() {
	rootCmd.AddCommand(upCmd)
	upCmd.Flags().BoolVar(&clearIntrospectionCache, "clear-introspection-cache", false, "clears the introspection cache")
}
