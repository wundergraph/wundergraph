package commands

import (
	"context"
	"fmt"
	"os"
	"path"
	"time"

	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/bundler"
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
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		configOutFile := path.Join(wundergraphDir, "generated", "bundle", "config.js")
		configBundler := bundler.NewBundler(bundler.Config{
			Name:       "config-bundler",
			EntryPoint: entryPoint,
			OutFile:    configOutFile,
			Logger:     log,
			WatchPaths: []string{},
			IgnorePaths: []string{
				"generated",
				"node_modules",
			},
		})

		configRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:       "config-runner",
			Executable: "node",
			ScriptArgs: []string{configOutFile},
			Logger:     log,
			ScriptEnv:  append(os.Environ(), fmt.Sprintf("WUNDERGRAPH_PUBLISH_API=%t", generateAndPublish)),
		})
		defer configRunner.Stop()

		go configBundler.Bundle(ctx)

		<-configBundler.BuildDoneChan

		<-configRunner.Run(ctx)

		if _, err := os.Stat(serverEntryPoint); err == nil {
			serverOutFile := path.Join(wundergraphDir, "generated", "bundle", "server.js")
			hooksBundler := bundler.NewBundler(bundler.Config{
				Name:       "server-bundler",
				EntryPoint: serverEntryPoint,
				OutFile:    serverOutFile,
				Logger:     log,
				WatchPaths: []string{},
			})

			go hooksBundler.Bundle(ctx)

			<-hooksBundler.BuildDoneChan
		} else {
			_, _ = white.Printf("Hooks EntryPoint not found, skipping. Source: %s\n", serverEntryPoint)
		}

		return nil
	},
}

func init() {
	generateCmd.Flags().BoolVarP(&generateAndPublish, "publish", "p", false, "publish the generated API immediately")
	generateCmd.Flags().StringVar(&listenAddr, "listen-addr", "localhost:9991", "listen_addr is the host:port combination, WunderGraph should listen on.")
	generateCmd.Flags().IntVar(&middlewareListenPort, "middleware-listen-port", 9992, "middleware-listen-port is the port which the WunderGraph middleware will bind to")

	rootCmd.AddCommand(generateCmd)
}
