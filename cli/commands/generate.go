package commands

import (
	"context"
	"fmt"
	"os"
	"path"
	"sync"
	"time"

	"github.com/wundergraph/wundergraph/pkg/webhooks"

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
		entryPoints, err := files.GetWunderGraphEntryPoints(wundergraphDir, configEntryPointFilename, serverEntryPointFilename)
		if err != nil {
			return fmt.Errorf("could not find file or directory: %s", err)
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		configOutFile := path.Join("generated", "bundle", "config.js")

		configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "config-runner",
			Executable:    "node",
			ScriptArgs:    []string{configOutFile},
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			Logger:        log,
			ScriptEnv: append(os.Environ(),
				fmt.Sprintf("WUNDERGRAPH_PUBLISH_API=%t", generateAndPublish),
				fmt.Sprintf("WG_SERVER_HOST=%s", serverHost),
				fmt.Sprintf("WG_SERVER_PORT=%d", serverListenPort),
				fmt.Sprintf("WG_NODE_URL=%s", fmt.Sprintf("http://%s", nodeListenAddr)),
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

		var onAfterBuild func()

		if entryPoints.ServerEntryPointAbs != "" {
			serverOutFile := path.Join(entryPoints.WunderGraphDirAbs, "generated", "bundle", "server.js")
			webhooksOutDir := path.Join("generated", "bundle", "webhooks")
			webhooksDir := path.Join(entryPoints.WunderGraphDirAbs, webhooks.WebhookDirectoryName)

			var webhooksBundler *bundler.Bundler

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

			hooksBundler := bundler.NewBundler(bundler.Config{
				Name:          "server-bundler",
				AbsWorkingDir: entryPoints.WunderGraphDirAbs,
				EntryPoints:   []string{serverEntryPointFilename},
				OutFile:       serverOutFile,
				Logger:        log,
			})

			onAfterBuild = func() {
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
				log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))
			}
		} else {
			_, _ = white.Printf("Hooks EntryPoint not found, skipping. File: %s\n", serverEntryPointFilename)
			onAfterBuild = func() {
				<-configRunner.Run(ctx)
				log.Debug("Config built!", abstractlogger.String("bundlerName", "config-bundler"))
			}
		}

		configBundler := bundler.NewBundler(bundler.Config{
			Name:          "config-bundler",
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			EntryPoints:   []string{configEntryPointFilename},
			OutFile:       configOutFile,
			Logger:        log,
			IgnorePaths: []string{
				"generated",
				"node_modules",
			},
			OnAfterBundle: onAfterBuild,
		})

		configBundler.Bundle()

		return nil
	},
}

func init() {
	generateCmd.Flags().BoolVarP(&generateAndPublish, "publish", "p", false, "publish the generated API immediately")
	generateCmd.Flags().StringVar(&nodeListenAddr, NodeListenAddrFlagName, "localhost:9991", fmt.Sprintf("%s is the host:port combination, WunderGraph should listen on.", NodeListenAddrFlagName))
	generateCmd.Flags().IntVar(&serverListenPort, MiddlewareListenPortFlagName, 9992, fmt.Sprintf("%s is the port which the WunderGraph middleware will bind to", MiddlewareListenPortFlagName))
	generateCmd.Flags().IntVar(&serverListenPort, ServerListenPortFlagName, 9992, fmt.Sprintf("%s is the port which the WunderGraph middleware will bind to", ServerListenPortFlagName))
	generateCmd.Flags().StringVar(&serverHost, ServerHostFlagName, "127.0.0.1", fmt.Sprintf("%s is the host which the WunderGraph middleware will bind to", ServerHostFlagName))
	generateCmd.Flags().StringVar(&configEntryPointFilename, "entrypoint", "wundergraph.config.ts", "entrypoint to build the config")
	generateCmd.Flags().StringVar(&serverEntryPointFilename, "serverEntryPoint", "wundergraph.server.ts", "entrypoint to build the server config")

	_ = generateCmd.Flags().MarkDeprecated(MiddlewareListenPortFlagName, fmt.Sprintf("%s is deprecated please use %s instead", MiddlewareListenPortFlagName, ServerListenPortFlagName))

	rootCmd.AddCommand(generateCmd)
}
