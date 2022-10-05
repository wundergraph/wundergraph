package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
	"io/ioutil"
	"os"
	"os/signal"
	"path"
	"syscall"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
)

var (
	excludeServer              bool
	disableForceHttpsRedirects bool
	enableIntrospection        bool
	gracefulTimeout            int
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Starts WunderGraph in production mode",
	Long:  `Start runs WunderGraph as a single process in production mode`,
	RunE: func(cmd *cobra.Command, args []string) error {
		configFile := path.Join(WunderGraphDir, "generated", configJsonFilename)
		if !files.FileExists(configFile) {
			return fmt.Errorf("could not find configuration file: %s", configFile)
		}

		ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		if !excludeServer {
			serverCtx, cancel := context.WithCancel(context.Background())
			defer cancel()

			serverScriptFile := path.Join("generated", "bundle", "server.js")
			serverExecutablePath := path.Join(WunderGraphDir, "generated", "bundle", "server.js")
			if !files.FileExists(serverExecutablePath) {
				return fmt.Errorf(`hooks server executable "%s" not found. Please use --exclude-server to disable the server`, path.Join(WunderGraphDir, serverScriptFile))
			}

			srvCfg := &helpers.ServerRunConfig{
				WunderGraphDirAbs: WunderGraphDir,
				ServerScriptFile:  serverScriptFile,
				Production:        true,
			}

			hookServerRunner := helpers.NewServerRunner(log, srvCfg)

			defer func() {
				log.Debug("Stopping hooks-server-runner server after WunderNode shutdown")
				err := hookServerRunner.Stop()
				if err != nil {
					log.Error("Stopping hooks-server-runner failed",
						abstractlogger.String("runnerName", "hooks-server-runner"),
						abstractlogger.Error(err),
					)
				}
			}()

			go func() {
				<-hookServerRunner.Run(serverCtx)
				if err := ctx.Err(); err != nil {
					log.Info("WunderGraph Server shutdown complete.")
				} else {
					log.Error("Hook server excited. Initialize WunderNode shutdown")
					stop()
				}
			}()
		}

		data, err := ioutil.ReadFile(configFile)
		if err != nil {
			log.Fatal("Failed to read file", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
			return err
		}
		if len(data) == 0 {
			log.Fatal("Config file is empty", abstractlogger.String("filePath", configFile))
			return nil
		}
		var graphConfig wgpb.WunderGraphConfiguration
		err = json.Unmarshal(data, &graphConfig)
		if err != nil {
			log.Fatal("Failed to unmarshal", abstractlogger.String("filePath", configFile), abstractlogger.Error(err))
			return err
		}

		wunderNodeConfig := node.CreateConfig(&graphConfig)
		n := node.New(ctx, BuildInfo, WunderGraphDir, log)

		go func() {
			err := n.StartBlocking(
				node.WithStaticWunderNodeConfig(wunderNodeConfig),
				node.WithForceHttpsRedirects(!disableForceHttpsRedirects),
				node.WithIntrospection(enableIntrospection),
				node.WithDebugMode(enableDebugMode),
			)
			if err != nil {
				log.Fatal("startBlocking", abstractlogger.Error(err))
			}
		}()

		gracefulTimeoutSeconds := gracefulTimeout
		n.HandleGracefulShutdown(gracefulTimeoutSeconds)

		return nil
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().IntVar(&gracefulTimeout, "graceful-timeout", 10, "graceful-timeout is the time in seconds the server has to graceful shutdown")
	startCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "starts the engine without the server")
	startCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "enables GraphQL introspection on /%api%/%main%/graphql")
	startCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "disables authentication to enforce https redirects")
}
