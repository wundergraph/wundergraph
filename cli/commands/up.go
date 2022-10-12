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

// upCmd represents the up command
var upCmd = &cobra.Command{
	Use:   "up",
	Short: "Start the WunderGraph application in the current dir",
	Long:  `Make sure wundergraph.config.json is present or set the flag accordingly`,
	RunE: func(cmd *cobra.Command, args []string) error {

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
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
			abstractlogger.String("version", BuildInfo.Version),
			abstractlogger.String("commit", BuildInfo.Commit),
			abstractlogger.String("date", BuildInfo.Date),
			abstractlogger.String("builtBy", BuildInfo.BuiltBy),
		)

		introspectionCacheDir := path.Join(wunderGraphDir, "cache", "introspection")

		configJsonPath := path.Join(wunderGraphDir, "generated", configJsonFilename)
		webhooksDir := path.Join(wunderGraphDir, webhooks.WebhookDirectoryName)
		configOutFile := path.Join("generated", "bundle", "config.js")
		serverOutFile := path.Join("generated", "bundle", "server.js")
		webhooksOutDir := path.Join("generated", "bundle", "webhooks")

		if port, err := helpers.ServerPortFromConfig(configJsonPath); err == nil {
			helpers.KillExistingHooksProcess(port, log)
		}

		configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-runner",
			Executable:    "node",
			AbsWorkingDir: wunderGraphDir,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			ScriptEnv: append(os.Environ(),
				fmt.Sprintf("WG_ENABLE_INTROSPECTION_CACHE=%t", !disableCache),
				fmt.Sprintf("WG_DIR_ABS=%s", wunderGraphDir),
			),
		})

		// responsible for executing the config in "polling" mode
		configIntrospectionRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-introspection-runner",
			Executable:    "node",
			AbsWorkingDir: wunderGraphDir,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			ScriptEnv: append(os.Environ(),
				// this environment variable starts the config runner in "Polling Mode"
				"WG_DATA_SOURCE_POLLING_MODE=true",
				fmt.Sprintf("WG_ENABLE_INTROSPECTION_CACHE=%t", !disableCache),
				fmt.Sprintf("WG_DIR_ABS=%s", wunderGraphDir),
			),
		})

		var hookServerRunner *scriptrunner.ScriptRunner
		var webhooksBundler *bundler.Bundler
		var onAfterBuild func() error

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
					OutDir:        webhooksOutDir,
					Logger:        log,
					OnAfterBundle: func() error {
						log.Debug("Webhooks bundled!", abstractlogger.String("bundlerName", "webhooks-bundler"))
						return nil
					},
				})
			}

			srvCfg := &helpers.ServerRunConfig{
				WunderGraphDirAbs: wunderGraphDir,
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
			AbsWorkingDir: wunderGraphDir,
			OutFile:       configOutFile,
			Logger:        log,
			WatchPaths: []*watcher.WatchPath{
				{Path: path.Join(wunderGraphDir, "operations"), Optional: true},
				{Path: path.Join(wunderGraphDir, "fragments"), Optional: true},
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

		err = configBundler.Bundle()
		if err != nil {
			log.Error("could not bundle",
				abstractlogger.String("bundlerName", "config-bundler"),
				abstractlogger.String("watcher", "config"),
				abstractlogger.Error(err),
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
					abstractlogger.String("watcher", "config"),
					abstractlogger.Error(err),
				)
			}
		}()

		n := node.New(ctx, BuildInfo, wunderGraphDir, log)
		go func() {
			configFile := path.Join(wunderGraphDir, "generated", "wundergraph.config.json")
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
				log.Error("node exited", abstractlogger.Error(err))
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
	rootCmd.AddCommand(upCmd)
}
