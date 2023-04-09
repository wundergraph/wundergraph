package commands

import (
	"context"
	"encoding/json"
	"errors"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/hashicorp/go-multierror"
	"github.com/muesli/termenv"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/ui/interactive"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

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
	verbose                                 bool
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

		var devTUI *tea.Program
		defaultOutput := termenv.DefaultOutput()

		// We only use the dev devTUI if we are in a tty and not in verbose mode
		if !verbose && defaultOutput.TTY() != nil {

			// For windows
			restoreConsole, err := termenv.EnableVirtualTerminalProcessing(defaultOutput)
			if err != nil {
				return err
			}
			defer restoreConsole()

			// Bubble Tea UI is not compatible with regular stdout logging
			// for those reasons we disable it. Any meaningful information should be logged to the dev devTUI
			log = zap.NewNop()
			devTUI = interactive.NewModel(ctx, &interactive.Options{
				ServerVersion: BuildInfo.Version,
			})

			go func() {
				if _, err := devTUI.Run(); err != nil {
					log.Error("error running reporter", zap.Error(err))
				}
				cancel()
			}()
		}

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
			SuppressStdStreams: devTUI != nil,
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
			SuppressStdStreams: devTUI != nil,
		})

		var hookServerRunner *scriptrunner.ScriptRunner
		var webhooksBundler *bundler.Bundler
		var onAfterBuild func(buildErr error, rebuild bool) error

		outExtension := make(map[string]string)
		outExtension[".js"] = ".cjs"

		bundleOperations := func() error {
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
			return nil
		}

		onBeforeBuild := func(rebuild bool) {
			if devTUI != nil {
				task := interactive.TaskStarted{
					Name: "Building",
				}
				devTUI.Send(task)
			}
		}

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
					OnAfterBundle: func(buildErr error, rebuild bool) error {
						log.Debug("Webhooks bundled!", zap.String("bundlerName", "webhooks-bundler"), zap.Bool("rebuild", rebuild))
						return nil
					},
				})
			}

			srvCfg := &helpers.HooksServerRunConfig{
				WunderGraphDirAbs:  wunderGraphDir,
				ServerScriptFile:   serverOutFile,
				Env:                helpers.CliEnv(rootFlags),
				Debug:              rootFlags.DebugMode,
				SuppressStdStreams: devTUI != nil,
			}

			hookServerRunner = helpers.NewHooksServerRunner(log, srvCfg)

			onAfterBuild = func(buildErr error, rebuild bool) (err error) {
				defer func() {
					if devTUI != nil {
						devTUI.Send(interactive.TaskEnded{
							Name: "Build completed",
							Err:  err,
						})
					}
				}()

				// if there is a build error, we don't want to continue
				if buildErr != nil {
					return buildErr
				}

				bundleOperationsErr := bundleOperations()
				if bundleOperationsErr != nil {
					return bundleOperationsErr
				}

				// generate new config
				<-configRunner.Run(ctx)
				if configRunner.Error() != nil {
					return configRunner.Error()
				}

				var wg errgroup.Group

				wg.Go(func() error {
					return hooksBundler.Bundle()
				})

				if webhooksBundler != nil {
					wg.Go(func() error {
						return webhooksBundler.Bundle()
					})
				}

				if err := wg.Wait(); err != nil {
					return err
				}

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
			log.Debug("hooks EntryPoint not found, skipping", zap.String("file", serverEntryPointFilename))

			onAfterBuild = func(buildErr error, rebuild bool) (err error) {
				defer func() {
					devTUI.Send(interactive.TaskEnded{
						Name: "Build completed",
						Err:  err,
					})
				}()

				// if there is a build error, we don't want to continue
				if buildErr != nil {
					return buildErr
				}

				// generate new config
				<-configRunner.Run(ctx)
				if configRunner.Error() != nil {
					return configRunner.Error()
				}

				go func() {
					// run or restart the introspection poller
					<-configIntrospectionRunner.Run(ctx)
				}()

				bundleOperationsErr := bundleOperations()
				if bundleOperationsErr != nil {
					return bundleOperationsErr
				}

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
			OnBeforeBundle: onBeforeBuild,
			OnAfterBundle:  onAfterBuild,
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
			options := []node.Option{
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
				node.WithDebugMode(rootFlags.DebugMode),
				node.WithInsecureCookies(),
				node.WithIntrospection(true),
				node.WithGitHubAuthDemo(GitHubAuthDemo),
				node.WithPrettyLogging(rootFlags.PrettyLogs),
				node.WithDevMode(),
			}

			if devTUI != nil {
				options = append(options, node.WithServerConfigLoadHandler(func(config node.WunderNodeConfig) {

					// The file is guaranteed to exist, because the server is only started after the config was built
					if data, err := os.ReadFile(filepath.Join(wunderGraphDir, "generated", "wundergraph.build_info.json")); err == nil {
						var buildInfo wgpb.BuildInfo
						if err := json.Unmarshal(data, &buildInfo); err == nil {
							devTUI.Send(interactive.ServerConfigLoaded{
								Webhooks:                 buildInfo.Stats.TotalWebhooks,
								Operations:               buildInfo.Stats.TotalOperations,
								DatasourceConfigurations: buildInfo.Stats.TotalApis,
								ServerURL:                "http://" + config.Api.PrimaryHost,
								FileUploads:              buildInfo.Stats.HasFileUpload,
								Authentication:           buildInfo.Stats.HashAuth,
								PlaygroundEnabled:        config.Api.EnableGraphqlEndpoint,
							})
						}
					}
				}))
				options = append(options, node.WithServerErrorHandler(func(err error) {
					devTUI.Send(interactive.ServerStartError{
						Err: multierror.Append(errors.New("could not start server"), err),
					})
				}))
			}

			err := n.StartBlocking(options...)
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

		log.Debug("Context was canceled. Initialize WunderNode shutdown ....")

		// close all listeners without waiting for them to finish
		_ = n.Close()

		log.Info("server shutdown complete")

		return nil
	},
}

func init() {
	upCmd.PersistentFlags().BoolVar(&upCmdPrettyLogging, "pretty-logging", true, "switches the logging to human readable format")
	upCmd.PersistentFlags().BoolVar(&verbose, "verbose", false, "disable terminal user interface and print all logs to stdout")
	upCmd.PersistentFlags().IntVar(&defaultDataSourcePollingIntervalSeconds, "default-polling-interval", 5, "default polling interval for data sources")
	upCmd.PersistentFlags().BoolVar(&disableCache, "no-cache", false, "disables local caches")
	upCmd.PersistentFlags().BoolVar(&clearCache, "clear-cache", false, "clears local caches before startup")

	rootCmd.AddCommand(upCmd)
}
