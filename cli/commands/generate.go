package commands

import (
	"context"
	"fmt"
	"os"
	"path"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/bundleconfig"
	"golang.org/x/sync/errgroup"
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
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		g, ctx := errgroup.WithContext(ctx)

		g.Go(func() error {
			configBundler, err := bundleconfig.NewBundler("config", bundleconfig.Config{
				EntryPoint:                  entryPoint,
				OutFile:                     path.Join(wundergraphDir, "generated", "bundle", "config.js"),
				ScriptEnv:                   append(os.Environ(), fmt.Sprintf("WUNDERGRAPH_PUBLISH_API=%t", generateAndPublish)),
				SkipWatch:                   true,
				BlockOnBuild:                true,
				EnableProcessEnvUsagePlugin: true,
			}, log)
			if err != nil {
				return err
			}

			configBundler.Run()

			if _, err := os.Stat(serverEntryPoint); err == nil {
				hooksBundler, err := bundleconfig.NewBundler("server", bundleconfig.Config{
					EntryPoint: serverEntryPoint,
					OutFile:    path.Join(wundergraphDir, "generated", "bundle", "server.js"),
					ScriptEnv: append(os.Environ(),
						fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
						fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
					),
					SkipWatch:    true,
					BlockOnBuild: true,
				}, log)
				if err != nil {
					log.Error("Generate, Error bundling hooks",
						abstractlogger.Error(err),
					)
					_, _ = red.Printf("Error bundling hooks: %s\n", err)
					return err
				}
				hooksBundler.Run()
			} else {
				_, _ = white.Printf("Hooks EntryPoint not found, skipping. Source: %s\n", serverEntryPoint)
			}
			return nil
		})

		return g.Wait()
	},
}

func init() {
	generateCmd.Flags().BoolVarP(&generateAndPublish, "publish", "p", false, "publish the generated API immediately")
	generateCmd.Flags().StringVar(&listenAddr, "listen-addr", "localhost:9991", "listen_addr is the host:port combination, WunderGraph should listen on.")
	generateCmd.Flags().IntVar(&middlewareListenPort, "middleware-listen-port", 9992, "middleware-listen-port is the port which the WunderGraph middleware will bind to")

	rootCmd.AddCommand(generateCmd)
}
