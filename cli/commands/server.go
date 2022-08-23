package commands

import (
	"context"
	"fmt"
	"path"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/runners"
	"github.com/wundergraph/wundergraph/pkg/files"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "",
	Long:  ``,
	RunE: func(cmd *cobra.Command, args []string) error {
		return nil
	},
}

var serverStartCmd = &cobra.Command{
	Use:   "start",
	Short: "",
	Long:  ``,
	RunE: func(cmd *cobra.Command, args []string) error {
		entryPoints, err := files.GetWunderGraphEntryPoints(wundergraphDir, configEntryPointFilename, serverEntryPointFilename)
		if err != nil {
			return fmt.Errorf("could not find file or directory: %s", err)
		}

		configFile := path.Join(entryPoints.WunderGraphDirAbs, "generated", configJsonFilename)
		if !files.FileExists(configFile) {
			return fmt.Errorf("could not find configuration file: %s", configFile)
		}

		serverScriptFile := path.Join("generated", "bundle", "server.js")
		serverExecutablePath := path.Join(entryPoints.WunderGraphDirAbs, "generated", "bundle", "server.js")
		if !files.FileExists(serverExecutablePath) {
			return fmt.Errorf(`hooks server build artifact "%s" not found. Please use --exclude-server to disable the server`, path.Join(wundergraphDir, serverScriptFile))
		}
		
		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		srvCfg := &runners.ServerRunConfig{
			EnableDebugMode:      enableDebugMode,
			WunderGraphDirAbs:    entryPoints.WunderGraphDirAbs,
			HooksJWT:             hooksJWT,
			MiddlewareListenPort: middlewareListenPort,
			ListenAddr:           listenAddr,
			ServerScriptFile:     serverScriptFile,
		}

		hookServerRunner := runners.NewServerRunner(log, srvCfg)

		<-hookServerRunner.Run(ctx)
		log.Error("Hook server excited. Initialize WunderNode shutdown")

		return nil
	},
}

func init() {
	serverCmd.AddCommand(serverStartCmd)
	rootCmd.AddCommand(serverCmd)
}
