package commands

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"

	"github.com/spf13/cobra"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/bundler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/operations"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/telemetry"
	"github.com/wundergraph/wundergraph/pkg/watcher"
	"github.com/wundergraph/wundergraph/pkg/webhooks"
)

const UpCmdName = "up"

var (
	upCmdPrettyLogging                      bool
	defaultDataSourcePollingIntervalSeconds int
	disableCache                            bool
	clearCache                              bool
)

// upCmd represents the up command
var upCmd = &cobra.Command{
	Use:         UpCmdName,
	Short:       "Starts WunderGraph in development mode",
	Long:        "Start the WunderGraph application in development mode and watch for changes",
	Annotations: telemetry.Annotations(telemetry.AnnotationCommand | telemetry.AnnotationDataSources),
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}

		if clearCache {
			if cacheDir, _ := helpers.LocalWunderGraphCacheDir(wunderGraphDir); cacheDir != "" {
				if err := os.RemoveAll(cacheDir); err != nil && !errors.Is(err, os.ErrNotExist) {
					return err
				}
			}
		}

		// only validate if the file exists
		_, err = files.CodeFilePath(wunderGraphDir, configEntryPointFilename)
		if err != nil {
			return err
		}

		// optional, no error check
		codeServerFilePath, _ := files.CodeFilePath(wunderGraphDir, serverEntryPointFilename)

		ctx, stop := signal.NotifyContext(ctx, os.Interrupt,
			syscall.SIGHUP,  // process is detached from terminal
			syscall.SIGTERM, // default for kill
			syscall.SIGKILL,
			syscall.SIGQUIT, // ctrl + \
			syscall.SIGINT,  // ctrl+c
		)
		defer stop()

		log.Info("Starting WunderNode",
			zap.String("version", BuildInfo.Version),
			zap.String("commit", BuildInfo.Commit),
			zap.String("date", BuildInfo.Date),
			zap.String("builtBy", BuildInfo.BuiltBy),
		)

		configJsonPath := filepath.Join(wunderGraphDir, "generated", configJsonFilename)
		webhooksDir := filepath.Join(wunderGraphDir, webhooks.WebhookDirectoryName)
		configOutFile := filepath.Join("generated", "bundle", "config.cjs")
		serverOutFile := filepath.Join("generated", "bundle", "server.cjs")
		operationsDir := filepath.Join(wunderGraphDir, operations.DirectoryName)
		generatedBundleOutDir := filepath.Join("generated", "bundle")

		if port, err := helpers.ServerPortFromConfig(configJsonPath); err == nil {
			helpers.KillExistingHooksProcess(port, log)
		}

		configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-runner",
			Executable:    "node",
			AbsWorkingDir: wunderGraphDir,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			FirstRunEnv: configScriptEnv(configScriptEnvOptions{
				RootFlags:      rootFlags,
				WunderGraphDir: wunderGraphDir,
				EnableCache:    !disableCache,
				FirstRun:       true,
			}),
			ScriptEnv: configScriptEnv(configScriptEnvOptions{
				RootFlags:      rootFlags,
				WunderGraphDir: wunderGraphDir,
				EnableCache:    !disableCache,
			}),
		})

		// responsible for executing the config in "polling" mode
		configIntrospectionRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-introspection-runner",
			Executable:    "node",
			AbsWorkingDir: wunderGraphDir,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			// WG_DATA_SOURCE_POLLING_MODE=true starts the config runner in "Polling Mode"
			ScriptEnv: append(configScriptEnv(configScriptEnvOptions{
				RootFlags:                     rootFlags,
				WunderGraphDir:                wunderGraphDir,
				EnableCache:                   !disableCache,
				DefaultPollingIntervalSeconds: defaultDataSourcePollingIntervalSeconds,
			}), "WG_DATA_SOURCE_POLLING_MODE=true"),
		})

		var hookServerRunner *scriptrunner.ScriptRunner
		var webhooksBundler *bundler.Bundler
		var onAfterBuild func() error

		outExtension := make(map[string]string)
		outExtension[".js"] = ".cjs"

		if codeServerFilePath != "" {
			hooksBundler := bundler.NewBundler(bundler.Config{
				Name:          "hooks-bundler",
				EntryPoints:   []string{serverEntryPointFilename},
				AbsWorkingDir: wunderGraphDir,
				OutFile:       serverOutFile,
				Logger:        log,
				WatchPaths: []*watcher.WatchPath{
					{Path: configJsonPath},
				},
			})

			if files.DirectoryExists(webhooksDir) {
				webhookPaths, err := webhooks.GetWebhooks(wunderGraphDir)
				if err != nil {
					return err
				}

				webhooksBundler = bundler.NewBundler(bundler.Config{
					Name:          "webhooks-bundler",
					EntryPoints:   webhookPaths,
					AbsWorkingDir: wunderGraphDir,
					OutDir:        generatedBundleOutDir,
					OutExtension:  outExtension,
					Logger:        log,
					OnAfterBundle: func() error {
						log.Debug("Webhooks bundled!", zap.String("bundlerName", "webhooks-bundler"))
						return nil
					},
				})
			}

			srvCfg := &helpers.ServerRunConfig{
				WunderGraphDirAbs: wunderGraphDir,
				ServerScriptFile:  serverOutFile,
				Env:               helpers.CliEnv(rootFlags),
			}

			hookServerRunner = helpers.NewServerRunner(log, srvCfg)

			onAfterBuild = func() error {
				log.Debug("Config built!", zap.String("bundlerName", "config-bundler"))

				if files.DirectoryExists(operationsDir) {
					operationsPaths, err := operations.GetPaths(wunderGraphDir)
					if err != nil {
						return err
					}
					err = operations.Cleanup(wunderGraphDir, operationsPaths)
					if err != nil {
						return err
					}
					err = operations.EnsureWunderGraphFactoryTS(wunderGraphDir)
					if err != nil {
						return err
					}
					operationsBundler := bundler.NewBundler(bundler.Config{
						Name:          "operations-bundler",
						EntryPoints:   operationsPaths,
						AbsWorkingDir: wunderGraphDir,
						OutDir:        generatedBundleOutDir,
						OutExtension:  outExtension,
						Logger:        log,
					})
					err = operationsBundler.Bundle()
					if err != nil {
						return err
					}
				}

				// generate new config
				<-configRunner.Run(ctx)

				var wg sync.WaitGroup

				wg.Add(1)
				go func() {
					defer wg.Done()
					// bundle hooks
					_ = hooksBundler.Bundle()
				}()

				if webhooksBundler != nil {
					wg.Add(1)
					go func() {
						defer wg.Done()
						_ = webhooksBundler.Bundle()
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
			log.Info("hooks EntryPoint not found, skipping", zap.String("file", serverEntryPointFilename))
			onAfterBuild = func() error {
				// generate new config
				<-configRunner.Run(ctx)

				go func() {
					// run or restart the introspection poller
					<-configIntrospectionRunner.Run(ctx)
				}()

				log.Debug("Config built!", zap.String("bundlerName", "config-bundler"))

				return nil
			}
		}

		configBundlerWatchPaths := []*watcher.WatchPath{
			{Path: filepath.Join(wunderGraphDir, "operations"), Optional: true},
			{Path: filepath.Join(wunderGraphDir, "fragments"), Optional: true},
			// all webhook filenames are stored in the config
			// we are going to create HTTP routes on the node for all of them
			{Path: webhooksDir, Optional: true},
			{Path: operationsDir, Optional: true},
		}

		if cacheDir, _ := helpers.LocalWunderGraphCacheDir(wunderGraphDir); cacheDir != "" {
			introspectionCacheDir := filepath.Join(cacheDir, "introspection")
			// a new cache entry is generated as soon as the introspection "poller" detects a change in the API dependencies
			// in that case we want to rerun the script to build a new config
			configBundlerWatchPaths = append(configBundlerWatchPaths, &watcher.WatchPath{Path: introspectionCacheDir})
		}

		configBundler := bundler.NewBundler(bundler.Config{
			Name:          "config-bundler",
			EntryPoints:   []string{configEntryPointFilename},
			AbsWorkingDir: wunderGraphDir,
			OutFile:       configOutFile,
			Logger:        log,
			WatchPaths:    configBundlerWatchPaths,
			IgnorePaths: []string{
				"node_modules",
			},
			OnAfterBundle: onAfterBuild,
		})

		err = configBundler.Bundle()
		if err != nil {
			log.Error("could not bundle",
				zap.String("bundlerName", "config-bundler"),
				zap.String("watcher", "config"),
				zap.Error(err),
			)
		}

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
					zap.String("watcher", "config"),
					zap.Error(err),
				)
			}
		}()

		n := node.New(ctx, BuildInfo, wunderGraphDir, log)
		go func() {
			configFile := filepath.Join(wunderGraphDir, "generated", "wundergraph.config.json")
			err := n.StartBlocking(
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
				node.WithDebugMode(rootFlags.DebugMode),
				node.WithInsecureCookies(),
				node.WithIntrospection(true),
				node.WithGitHubAuthDemo(GitHubAuthDemo),
				node.WithPrettyLogging(rootFlags.PrettyLogs),
				node.WithDevMode(),
			)
			if err != nil {
				log.Error("node exited", zap.Error(err))
				// exit context because we can't recover from a server start error
				cancel()
			}
		}()

		// trigger server reload after initial config build
		// because no fs event is fired as build is already done
		configFileChangeChan <- struct{}{}

		// wait for context to be canceled (signal, context cancellation or via cancel())
		<-ctx.Done()

		log.Info("Context was canceled. Initialize WunderNode shutdown ....")

		// close all listeners without waiting for them to finish
		_ = n.Close()

		log.Info("server shutdown complete")

		return nil
	},
}

func init() {
	upCmd.PersistentFlags().BoolVar(&upCmdPrettyLogging, "pretty-logging", true, "switches the logging to human readable format")
	upCmd.PersistentFlags().IntVar(&defaultDataSourcePollingIntervalSeconds, "default-polling-interval", 5, "default polling interval for data sources")
	upCmd.PersistentFlags().BoolVar(&disableCache, "no-cache", false, "disables local caches")
	upCmd.PersistentFlags().BoolVar(&clearCache, "clear-cache", false, "clears local caches before startup")

	rootCmd.AddCommand(upCmd)
}
