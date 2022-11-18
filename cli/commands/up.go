package commands

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path"
	"sync"
	"syscall"

	"github.com/spf13/cobra"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/bundler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/httpinterceptor"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/watcher"
	"github.com/wundergraph/wundergraph/pkg/webhooks"
)

const UpCmdName = "up"

var upCmdPrettyLogging bool
var interceptHttp string

// upCmd represents the up command
var upCmd = &cobra.Command{
	Use:   UpCmdName,
	Short: "Starts WunderGraph in development mode",
	Long:  "Start the WunderGraph application in development mode and watch for changes",
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

		var nodeOptions []node.Option

		if interceptHttp != "" {
			nodeOptions = append(nodeOptions, node.WithHTTPRoundTripperHijacker(func(roundTripper http.RoundTripper) http.RoundTripper {
				return httpinterceptor.New(roundTripper, httpinterceptor.Func(func(r *http.Request) (*http.Response, error) {
					req, err := http.NewRequest(r.Method, interceptHttp, r.Body)
					if err != nil {
						return nil, err
					}
					req.Header.Add("X-Request-Url", r.URL.String())
					resp, err := http.DefaultClient.Do(req)
					if err != nil {
						return nil, err
					}
					// TODO: StatusCode to disable network
					if resp.StatusCode == 599 {
						// Send the request to the next transport
						return nil, httpinterceptor.ErrContinue
					}
					return resp, err
				}))
			}))
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
			ScriptEnv: append(helpers.CliEnv(rootFlags),
				fmt.Sprintf("WG_ENABLE_INTROSPECTION_CACHE=%t", !disableCache),
				fmt.Sprintf("WG_DIR_ABS=%s", wunderGraphDir),
				fmt.Sprintf("%s=%s", wunderctlBinaryPathEnvKey, wunderctlBinaryPath()),
			),
		})

		// responsible for executing the config in "polling" mode
		configIntrospectionRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-introspection-runner",
			Executable:    "node",
			AbsWorkingDir: wunderGraphDir,
			ScriptArgs:    []string{configOutFile},
			Logger:        log,
			ScriptEnv: append(helpers.CliEnv(rootFlags),
				// this environment variable starts the config runner in "Polling Mode"
				"WG_DATA_SOURCE_POLLING_MODE=true",
				fmt.Sprintf("WG_ENABLE_INTROSPECTION_CACHE=%t", !disableCache),
				fmt.Sprintf("WG_DIR_ABS=%s", wunderGraphDir),
				fmt.Sprintf("%s=%s", wunderctlBinaryPathEnvKey, wunderctlBinaryPath()),
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
			configFile := path.Join(wunderGraphDir, "generated", "wundergraph.config.json")
			nodeOptions = append(nodeOptions,
				node.WithConfigFileChange(configFileChangeChan),
				node.WithFileSystemConfig(configFile),
				node.WithDebugMode(rootFlags.DebugMode),
				node.WithInsecureCookies(),
				node.WithIntrospection(true),
				node.WithGitHubAuthDemo(GitHubAuthDemo),
				node.WithPrettyLogging(rootFlags.PrettyLogs),
				node.WithDevMode())
			err := n.StartBlocking(nodeOptions...)
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
	upCmd.PersistentFlags().StringVar(&interceptHttp, "intercept-http", "", "intercepts HTTP(S) requests using the given URL")

	rootCmd.AddCommand(upCmd)
}
