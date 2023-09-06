package commands

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/hashicorp/go-multierror"
	"github.com/mattn/go-isatty"
	"github.com/muesli/termenv"
	"github.com/spf13/cobra"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/bundler"
	"github.com/wundergraph/wundergraph/pkg/cli"
	"github.com/wundergraph/wundergraph/pkg/codegeneration"
	"github.com/wundergraph/wundergraph/pkg/cui"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/licensing"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/operations"
	"github.com/wundergraph/wundergraph/pkg/restart"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/telemetry"
	"github.com/wundergraph/wundergraph/pkg/watcher"
	"github.com/wundergraph/wundergraph/pkg/webhooks"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

const UpCmdName = "up"

var (
	defaultDataSourcePollingIntervalSeconds int
	disableCache                            bool
	clearCacheOnStart                       bool
	enableTUI                               bool
	logs                                    bool
	restartFunc                             func()
)

type cuiHandler struct {
	ctx               context.Context
	cancel            func()
	wunderGraphDir    string
	runtimeReloadChan chan<- struct{}
	configBundler     *bundler.Bundler
	log               *zap.Logger
}

func (h *cuiHandler) SetConfigBundler(b *bundler.Bundler) {
	h.configBundler = b
}

func (h *cuiHandler) Quit() {
	h.cancel()
}

func (h *cuiHandler) ClearCache() {
	if err := clearCache(h.wunderGraphDir); err != nil {
		h.log.Error("clearing cache", zap.Error(err))
	} else {
		h.log.Info("cache cleared")
	}
}

func (h *cuiHandler) RebuildAndRestartApp() {
	// This might not be available because it's initialized later
	if h.configBundler != nil {
		clearScreen()
		h.configBundler.Bundle()
	}
}

func (h *cuiHandler) Restart(debugMode bool) {
	restartFunc = func() {
		err := restart.Restart(&restart.Options{
			Args: func(args []string) []string {
				newArgs := make([]string, 0, len(args))
				for _, arg := range args {
					if strings.HasPrefix(arg, "--debug=") || arg == "--debug" {
						continue
					}
					newArgs = append(newArgs, arg)
				}
				if debugMode {
					newArgs = append(newArgs, "--debug")
				}
				return newArgs
			},
		})
		if err != nil {
			log.Error("could not restart", zap.Error(err))
		}
	}
	h.Quit()
}

// clearScreen clears the screen so the new log messages appear at the top
func clearScreen() {
	const (
		Esc             = "\u001B["
		CursorToTopLeft = Esc + "1;1H"
		EraseDown       = Esc + "J"
	)
	fmt.Print(CursorToTopLeft)
	fmt.Print(EraseDown)
}

func triggerNodeReload(ctx context.Context, serverNotifyConfigCh chan<- struct{}) {
	// Make sure we don't get stuck here if the node has already
	// exited when we reach this point (and no one is reading from
	// configFileChangeChan)
	select {
	case serverNotifyConfigCh <- struct{}{}:
	case <-ctx.Done():
	}
}

func clearCache(wunderGraphDir string) error {
	cacheDir, err := helpers.LocalWunderGraphCacheDir(wunderGraphDir)
	if err != nil {
		return err
	}
	if cacheDir != "" {
		if err := os.RemoveAll(cacheDir); err != nil && !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}
	return nil
}

// upCmd represents the up command
var upCmd = &cobra.Command{
	Use:         UpCmdName,
	Short:       "Starts WunderGraph in development mode",
	Long:        "Start the WunderGraph application in development mode and watch for changes",
	Annotations: telemetry.Annotations(telemetry.AnnotationCommand | telemetry.AnnotationDataSources | telemetry.AnnotationFeatures),
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}

		// Used for triggering reloads of the runtime
		configFileChangeChan := make(chan struct{})

		natsEmbeddedServerURL := startEmbeddedNats(ctx, log)

		// Enable TUI only if stdout is a terminal
		if !isatty.IsTerminal(os.Stdout.Fd()) {
			// Always use JSON when not in a terminal
			enableTUI = false
		}

		// Bubbletea UI is not compatible with regular stdout logging
		if enableTUI {
			if rootFlags.DebugMode {
				log.Warn("Debug mode is enabled. This will disable the TUI.")
				enableTUI = false
			} else if logs {
				log.Warn("Logs are enabled. This will disable the TUI.")
				enableTUI = false
			}
		}

		var consoleUI *cui.UI
		var consoleHandler *cuiHandler

		if !enableTUI {
			consoleHandler = &cuiHandler{
				ctx:               ctx,
				cancel:            cancel,
				runtimeReloadChan: configFileChangeChan,
				wunderGraphDir:    wunderGraphDir,
				log:               log,
			}

			consoleUI = cui.New(consoleHandler, cui.Options{
				Debug: rootFlags.DebugMode,
			})

			if err := consoleUI.Open(); err != nil {
				log.Warn("could not enable console UI", zap.Error(err))
			} else {
				go consoleUI.Run()
				defer consoleUI.Close()
			}
		}

		var devTUI *tea.Program
		defaultOutput := termenv.DefaultOutput()

		if enableTUI {

			// For windows
			restoreConsole, err := termenv.EnableVirtualTerminalProcessing(defaultOutput)
			if err != nil {
				return err
			}
			defer restoreConsole()

			// Bubbletea UI is not compatible with regular stdout logging
			// for those reasons we disable it and override the global logger. Any meaningful information
			// should be logged to the UI or for deeper investigation the user should disable the UI and use the logging mode
			log = zap.NewNop()

			devTUI = cli.NewModel(ctx, &cli.Options{ServerVersion: BuildInfo.Version})

			go func() {
				if _, err := devTUI.Run(); err != nil {
					log.Error("error running tui program", zap.Error(err))
				}
				cancel()
			}()
		}

		reportErrToTUI := func(err error) {
			if err != nil && devTUI != nil {
				devTUI.Send(cli.Error{Err: err})
			}
		}

		var licensingOutput io.Writer = os.Stderr
		if enableTUI {
			licensingOutput = io.Discard
		}
		go licensing.NewManager(licensingPublicKey).LicenseCheck(wunderGraphDir, cancel, licensingOutput)

		if clearCacheOnStart {
			if err := clearCache(wunderGraphDir); err != nil {
				return err
			}
		}

		configEntryPoint, err := codegeneration.ApplicationEntryPoint(wunderGraphDir)
		if err != nil {
			return err
		}

		// hook server is optional, so we don't error if it doesn't exist
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

		configFilePath := filepath.Join(wunderGraphDir, "generated", serializedConfigFilename)
		webhooksDir := filepath.Join(wunderGraphDir, webhooks.WebhookDirectoryName)
		configOutFile := filepath.Join("generated", "bundle", "config.cjs")
		serverOutFile := filepath.Join("generated", "bundle", "server.cjs")
		ormOutFile := filepath.Join(wunderGraphDir, "generated", "bundle", "orm.cjs")
		jsonSchemaOutFile := filepath.Join(wunderGraphDir, "generated", "bundle", "jsonschema.cjs")
		operationsDir := filepath.Join(wunderGraphDir, operations.DirectoryName)
		generatedBundleOutDir := filepath.Join("generated", "bundle")

		if port, err := helpers.ServerPortFromConfig(configFilePath); err == nil {
			helpers.KillExistingHooksProcess(port, log)
		}

		scriptRunnerOutputConfig := helpers.ScriptRunnerOutputConfig(rootFlags)
		if enableTUI {
			scriptRunnerOutputConfig = &scriptrunner.OutputConfig{
				Stdout: io.Discard,
				Stderr: io.Discard,
			}
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
				EnableTUI:      enableTUI,
				FirstRun:       true,
			}),
			ScriptEnv: configScriptEnv(configScriptEnvOptions{
				RootFlags:      rootFlags,
				WunderGraphDir: wunderGraphDir,
				EnableCache:    !disableCache,
				EnableTUI:      enableTUI,
			}),
			Output: scriptRunnerOutputConfig,
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
				EnableTUI:                     enableTUI,
			}), "WG_DATA_SOURCE_POLLING_MODE=true"),
			Output: scriptRunnerOutputConfig,
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

		if codeServerFilePath != "" {
			ormEntryPointFilename := filepath.Join(wunderGraphDir, "generated", "orm", "index.ts")
			ormBundler := bundler.NewBundler(bundler.Config{
				Name:          "orm-bundler",
				Production:    true,
				AbsWorkingDir: wunderGraphDir,
				EntryPoints:   []string{ormEntryPointFilename},
				OutFile:       ormOutFile,
				Logger:        log,
			})

			jsonSchemaEntryPointFilename := filepath.Join(wunderGraphDir, "generated", "jsonschema.ts")
			jsonSchemaBundler := bundler.NewBundler(bundler.Config{
				Name:          "jsonschema-bundler",
				Production:    true,
				AbsWorkingDir: wunderGraphDir,
				EntryPoints:   []string{jsonSchemaEntryPointFilename},
				OutFile:       jsonSchemaOutFile,
				Logger:        log,
			})

			hooksBundler := bundler.NewBundler(bundler.Config{
				Name:          "hooks-bundler",
				EntryPoints:   []string{serverEntryPointFilename},
				AbsWorkingDir: wunderGraphDir,
				OutFile:       serverOutFile,
				Logger:        log,
				WatchPaths: []*watcher.WatchPath{
					{Path: configFilePath},
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
				WunderGraphDirAbs: wunderGraphDir,
				ServerScriptFile:  serverOutFile,
				Env:               helpers.CliEnv(rootFlags),
				Debug:             rootFlags.DebugMode,
				DebugBindAddress:  debugBindAddress,
				Log:               rootFlags.Log,
				Output:            scriptRunnerOutputConfig,
			}

			hookServerRunner = helpers.NewHooksServerRunner(log, srvCfg)

			onAfterBuild = func(buildErr error, rebuild bool) (err error) {
				defer func() {
					if devTUI != nil {
						devTUI.Send(cli.TaskEnded{
							Label: "Build completed",
							Err:   err,
						})
					} else if consoleUI != nil {
						consoleUI.PrintShortHelp()
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
					return ormBundler.Bundle()
				})

				wg.Go(func() error {
					return hooksBundler.Bundle()
				})

				wg.Go(func() error {
					return jsonSchemaBundler.Bundle()
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
					reportErrToTUI(hookServerRunner.Error())
				}()

				go func() {
					// run or restart the introspection poller
					<-configIntrospectionRunner.Run(ctx)
					reportErrToTUI(configIntrospectionRunner.Error())
				}()

				return nil
			}
		} else {
			log.Debug("wundergraph.server.ts not found, skipping server", zap.String("file", serverEntryPointFilename))

			onAfterBuild = func(buildErr error, rebuild bool) (err error) {
				defer func() {
					devTUI.Send(cli.TaskEnded{
						Label: "Build completed",
						Err:   err,
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
					reportErrToTUI(configIntrospectionRunner.Error())
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
			EntryPoints:   []string{configEntryPoint},
			AbsWorkingDir: wunderGraphDir,
			OutFile:       configOutFile,
			Logger:        log,
			WatchPaths:    configBundlerWatchPaths,
			IgnorePaths: []string{
				"node_modules",
			},
			OnWatch: func(paths []string) {
				if devTUI != nil {
					task := cli.TaskStarted{
						Label: "Building",
					}
					devTUI.Send(task)
				} else {
					clearScreen()
				}
			},
			OnAfterBundle: onAfterBuild,
		})

		consoleHandler.SetConfigBundler(configBundler)

		if devTUI != nil {
			devTUI.Send(cli.TaskStarted{
				Label: "Building",
			})
		}

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

		configWatcher := watcher.NewWatcher("config", &watcher.Config{
			WatchPaths: []*watcher.WatchPath{
				{Path: configFilePath},
			},
		}, log)

		go func() {
			err := configWatcher.Watch(ctx, func(paths []string) error {
				triggerNodeReload(ctx, configFileChangeChan)
				return nil
			})
			if err != nil {
				log.Error("watcher",
					zap.String("watcher", "config"),
					zap.Error(err),
				)
			}
		}()

		var nodeLogger *zap.Logger

		if enableTUI {
			nodeLogger = zap.NewNop()
		} else {
			nodeLogger = logging.New(rootFlags.PrettyLogs, rootFlags.DebugMode, zapLogLevelSetter)
		}

		n := node.New(ctx, BuildInfo, wunderGraphDir, nodeLogger)

		go func() {
			configFile := filepath.Join(wunderGraphDir, "generated", serializedConfigFilename)
			options := []node.Option{
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
				node.WithInsecureCookies(),
				node.WithIntrospection(true),
				node.WithGitHubAuthDemo(GitHubAuthDemo),
				node.WithRequestLogging(rootFlags.DebugMode),
				node.WithTraceBatchTimeout(1000 * time.Millisecond),
				node.WithDevMode(),
				node.WithNATSDefaultServerURL(natsEmbeddedServerURL),
			}

			options = append(options, node.WithServerConfigLoadHandler(func(config *node.WunderNodeConfig) {
				updateLoggingLevel(config.Api.Options.Logging.Level)
				if devTUI != nil {
					// The file is guaranteed to exist, because the server is only started after the config was built
					if data, err := os.ReadFile(filepath.Join(wunderGraphDir, "generated", "wundergraph.build_info.json")); err == nil {
						var buildInfo wgpb.BuildInfo
						if err := json.Unmarshal(data, &buildInfo); err == nil {
							devTUI.Send(cli.ServerConfigLoaded{
								Webhooks:                 buildInfo.Stats.TotalWebhooks,
								Operations:               buildInfo.Stats.TotalOperations,
								DatasourceConfigurations: buildInfo.Stats.TotalApis,
								ServerURL:                "http://" + config.Api.PrimaryHost,
								FileUploads:              buildInfo.Stats.HasUploadProvider,
								Authentication:           buildInfo.Stats.HasAuthenticationProvider,
								PlaygroundEnabled:        config.Api.EnableGraphqlEndpoint,
								SdkVersion:               buildInfo.Sdk.Version,
								WunderctlVersion:         buildInfo.Wunderctl.Version,
							})
						}
					}
				}
			}))
			options = append(options, node.WithServerErrorHandler(func(err error) {
				reportErrToTUI(multierror.Append(errors.New("could not start server"), err))
			}))

			err := n.StartBlocking(options...)
			if err != nil {
				log.Error("node exited", zap.Error(err))
				// exit context because we can't recover from a server start error
				cancel()
			}
		}()

		// trigger server reload after initial config build
		// because no fs event is fired as build if already done
		triggerNodeReload(ctx, configFileChangeChan)

		// wait for context to be canceled (signal, context cancellation or via cancel())
		<-ctx.Done()

		log.Debug("Context was canceled. Initialize WunderNode shutdown ....")

		// close all listeners without waiting for them to finish
		_ = n.Close()

		log.Info("server shutdown complete")

		if restartFunc != nil {
			if consoleUI != nil {
				// Make sure we release the keyboard handle before
				// the new process starts
				consoleUI.Close()
			}
			restartFunc()
			os.Exit(0)
		}

		return nil
	},
}

func init() {
	upCmd.PersistentFlags().BoolVar(&enableTUI, "ui", true, "Enable terminal user interface")
	upCmd.PersistentFlags().BoolVar(&logs, "logs", false, "Enable log mode. Useful for debugging")
	upCmd.PersistentFlags().IntVar(&defaultDataSourcePollingIntervalSeconds, "default-polling-interval", 5, "Default polling interval for data sources")
	upCmd.PersistentFlags().BoolVar(&disableCache, "no-cache", false, "Disables local caches")
	upCmd.PersistentFlags().BoolVar(&clearCacheOnStart, "clear-cache", false, "Clears local caches before startup")
	upCmd.PersistentFlags().BoolVar(&rootFlags.PrettyLogs, prettyLoggingFlagName, true, "Enables pretty logging")

	rootCmd.AddCommand(upCmd)
}
