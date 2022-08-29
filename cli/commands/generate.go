package commands

import (
	"context"
	"fmt"
	"github.com/wundergraph/wundergraph/pkg/webhooks"
	"golang.org/x/sync/errgroup"
	"os"
	"path"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/bundler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

var (
	generateAndPublish bool
)

// generateCmd represents the generate command
var generateCmd = &cobra.Command{
	Use:   "generate",
	Short: "Runs the code generation process once",
	Long: `In contrast to wunderctl up, it only generates all files in ./generated but doesn't start WunderGraph or the hooks.
Use this command if you only want to generate the configuration`,
	RunE: func(cmd *cobra.Command, args []string) error {
		wgDir, err := files.FindWunderGraphDir(wundergraphDir)
		if err != nil {
			return fmt.Errorf("unable to find .wundergraph dir: %w", err)
		}

		// only validate if the file exists
		_, err = files.CodeFilePath(wgDir, configEntryPointFilename)
		if err != nil {
			return fmt.Errorf(files.CodeFileNotFoundErrorMsg, configEntryPointFilename)
		}

		// optional
		codeServerFilePath, _ := files.CodeFilePath(wgDir, serverEntryPointFilename)
		if err != nil {
			return fmt.Errorf(files.CodeFileNotFoundErrorMsg, serverEntryPointFilename)
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		configOutFile := path.Join("generated", "bundle", "config.js")

		configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-runner",
			Executable:    "node",
			ScriptArgs:    []string{configOutFile},
			AbsWorkingDir: wgDir,
			Logger:        log,
			ScriptEnv:     append(os.Environ(), fmt.Sprintf("WUNDERGRAPH_PUBLISH_API=%t", generateAndPublish)),
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

		var onAfterBuild func() error

		if codeServerFilePath != "" {
			serverOutFile := path.Join(wgDir, "generated", "bundle", "server.js")
			webhooksOutDir := path.Join("generated", "bundle", "webhooks")
			webhooksDir := path.Join(wgDir, webhooks.WebhookDirectoryName)

			var webhooksBundler *bundler.Bundler

			if files.DirectoryExists(webhooksDir) {
				webhookPaths, err := webhooks.GetWebhooks(wgDir)
				if err != nil {
					return err
				}
				webhooksBundler = bundler.NewBundler(bundler.Config{
					Name:          "webhooks-bundler",
					EntryPoints:   webhookPaths,
					AbsWorkingDir: wgDir,
					OutDir:        webhooksOutDir,
					Logger:        log,
					OnAfterBundle: func() error {
						log.Debug("Webhooks bundled!", abstractlogger.String("bundlerName", "webhooks-bundler"))
						return nil
					},
				})
			}

			hooksBundler := bundler.NewBundler(bundler.Config{
				Name:          "server-bundler",
				AbsWorkingDir: wgDir,
				EntryPoints:   []string{serverEntryPointFilename},
				OutFile:       serverOutFile,
				Logger:        log,
			})

			onAfterBuild = func() error {
				<-configRunner.Run(ctx)

				if !configRunner.Successful() {
					return fmt.Errorf("configuration could not be generated. Process exit with code %d",
						configRunner.ExitCode(),
					)
				}

				var wg errgroup.Group

				wg.Go(func() error {
					// bundle hooks
					return hooksBundler.Bundle()
				})

				if webhooksBundler != nil {
					wg.Go(func() error {
						// bundle webhooks
						return webhooksBundler.Bundle()
					})
				}

				err := wg.Wait()
				log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))

				return err
			}
		} else {
			_, _ = white.Printf("Hooks EntryPoint not found, skipping. File: %s\n", serverEntryPointFilename)
			onAfterBuild = func() error {
				<-configRunner.Run(ctx)

				if !configRunner.Successful() {
					return fmt.Errorf("configuration could not be generated. Process exit with code %d",
						configRunner.ExitCode(),
					)
				}

				log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))

				return nil
			}
		}

		configBundler := bundler.NewBundler(bundler.Config{
			Name:          "config-bundler",
			AbsWorkingDir: wgDir,
			EntryPoints:   []string{configEntryPointFilename},
			OutFile:       configOutFile,
			Logger:        log,
			IgnorePaths: []string{
				"generated",
				"node_modules",
			},
			OnAfterBundle: onAfterBuild,
		})

		err = configBundler.Bundle()

		return err
	},
}

func init() {
	generateCmd.Flags().BoolVarP(&generateAndPublish, "publish", "p", false, "publish the generated API immediately")
	generateCmd.Flags().StringVar(&listenAddr, "listen-addr", "localhost:9991", "listen_addr is the host:port combination, WunderGraph should listen on.")
	generateCmd.Flags().IntVar(&middlewareListenPort, "middleware-listen-port", 9992, "middleware-listen-port is the port which the WunderGraph middleware will bind to")
	generateCmd.Flags().StringVar(&configEntryPointFilename, "entrypoint", "wundergraph.config.ts", "entrypoint to build the config")
	generateCmd.Flags().StringVar(&serverEntryPointFilename, "serverEntryPoint", "wundergraph.server.ts", "entrypoint to build the server config")

	rootCmd.AddCommand(generateCmd)
}
