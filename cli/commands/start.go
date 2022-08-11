package commands

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/signal"
	"path"
	"syscall"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
	"github.com/wundergraph/wundergraph/pkg/wundernodeconfig"
	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

/*

ENV VARIABLES:
token
control plane url

wunderctl start --managed --node-config wundergraph-node.config.json

*/

var (
	excludeServer              bool
	disableForceHttpsRedirects bool
	enableIntrospection        bool
	gracefulTimeout            int
	configJsonFilename         string
	enableManagedMode          bool
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start runs WunderGraph in production mode",
	Long: `Running WunderGraph in production mode means,
no code generation, no directory watching, no config updates,
just running the engine as efficiently as possible without the dev overhead.

If used without --exclude-server, make sure the server is available in this directory:
{entrypoint}/bundle/server.js or override it with --server-entrypoint.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		runner := NewNodeRunner()

		if enableManagedMode {
			return runner.startManaged()
		}

		return runner.startRegular()
	},
}

type NodeRunner struct {
	quit chan os.Signal
}

func NewNodeRunner() *NodeRunner {
	quit := make(chan os.Signal, 2)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	return &NodeRunner{
		quit: quit,
	}
}

func (r *NodeRunner) startManaged() error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg, err := wundernodeconfig.Load(true)
	if err != nil {
		return err
	}

	options := []node.Option{
		node.WithManagedMode(true),
	}

	cachedConfig := r.loadCachedConfig(cfg.LoadConfig.CachedConfigPath)
	if cachedConfig != nil {
		options = append(options, node.WithStaticWunderNodeConfig(*cachedConfig))
	}

	n := node.New(ctx, BuildInfo, cfg, log)

	go func() {
		if err := n.StartBlocking(options...); err != nil {
			log.Fatal("startBlocking", abstractlogger.Error(err))
		}
	}()

	r.handleGracefulShutdown(ctx, n)

	return nil
}

func (r *NodeRunner) loadCachedConfig(filePath string) *wgpb.WunderNodeConfig {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Debug("loadCachedConfig ioutil.ReadFile", abstractlogger.String("filePath", filePath), abstractlogger.Error(err))
		log.Debug("loadCachedConfig no cached config found")
		return nil
	}
	var nodeConfig wgpb.WunderNodeConfig
	err = json.Unmarshal(data, &nodeConfig)
	if err != nil {
		log.Debug("loadCachedConfig json.Unmarshal", abstractlogger.String("filePath", filePath), abstractlogger.Error(err))
		log.Debug("loadCachedConfig failed to unmarshal cached config")
		return nil
	}

	return &nodeConfig
}

func (r *NodeRunner) startRegular() error {
	entryPoints, err := files.GetWunderGraphEntryPoints(wundergraphDir, configEntryPointFilename, serverEntryPointFilename)
	if err != nil {
		return fmt.Errorf("could not find file or directory: %s", err)
	}

	configFile := path.Join(entryPoints.WunderGraphDirAbs, "generated", configJsonFilename)
	if !files.FileExists(configFile) {
		return fmt.Errorf("could not find configuration file: %s", configFile)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	secret, err := apihandler.GenSymmetricKey(64)
	if err != nil {
		return err
	}

	if !excludeServer {

		hooksJWT, err := apihandler.CreateHooksJWT(secret)
		if err != nil {
			return err
		}

		serverScriptFile := path.Join("generated", "bundle", "server.js")
		serverExecutablePath := path.Join(entryPoints.WunderGraphDirAbs, "generated", "bundle", "server.js")
		if !files.FileExists(serverExecutablePath) {
			return fmt.Errorf(`hooks server build artifact "%s" not found. Please use --exclude-server to disable the server`, path.Join(wundergraphDir, serverScriptFile))
		}

		hooksEnv := []string{
			"START_HOOKS_SERVER=true",
			fmt.Sprintf("WG_ABS_DIR=%s", entryPoints.WunderGraphDirAbs),
			fmt.Sprintf("HOOKS_TOKEN=%s", hooksJWT),
			fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", middlewareListenPort),
			fmt.Sprintf("WG_LISTEN_ADDR=%s", listenAddr),
		}

		if enableDebugMode {
			hooksEnv = append(hooksEnv, "LOG_LEVEL=debug")
		}

		hookServerRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
			Name:          "hooks-server-runner",
			Executable:    "node",
			AbsWorkingDir: entryPoints.WunderGraphDirAbs,
			ScriptArgs:    []string{serverScriptFile},
			Logger:        log,
			ScriptEnv:     append(os.Environ(), hooksEnv...),
		})

		defer func() {
			log.Debug("Stopping hooks-server-runner server after WunderNode shutdown")
			err := hookServerRunner.Stop()
			if err != nil {
				log.Error("Stopping runner failed",
					abstractlogger.String("runnerName", "hooks-server-runner"),
					abstractlogger.Error(err),
				)
			}
		}()

		go func() {
			<-hookServerRunner.Run(ctx)
			log.Error("Hook server excited. Initialize WunderNode shutdown")
			// cancel context when hook server stopped
			cancel()
		}()
	}

	cfg := &wundernodeconfig.Config{
		Server: &wundernodeconfig.ServerConfig{
			ListenAddr: listenAddr,
		},
	}

	configFileChangeChan := make(chan struct{})
	n := node.New(ctx, BuildInfo, cfg, log)

	go func() {
		err := n.StartBlocking(
			node.WithConfigFileChange(configFileChangeChan),
			node.WithFileSystemConfig(configFile),
			node.WithHooksSecret(secret),
			node.WithDebugMode(enableDebugMode),
			node.WithForceHttpsRedirects(!disableForceHttpsRedirects),
			node.WithIntrospection(enableIntrospection),
			node.WithGitHubAuthDemo(GitHubAuthDemo),
		)
		if err != nil {
			log.Fatal("startBlocking", abstractlogger.Error(err))
		}
	}()

	// trigger server reload after initial config build
	// because no fs event is fired as build is already done
	configFileChangeChan <- struct{}{}

	r.handleGracefulShutdown(ctx, n)

	return nil
}

func (r *NodeRunner) handleGracefulShutdown(ctx context.Context, n *node.Node) {
	select {
	case quitSignal := <-r.quit:
		log.Info("Received interrupt quitSignal. Initialize WunderNode shutdown ...",
			abstractlogger.String("quitSignal", quitSignal.String()),
		)
	case <-ctx.Done():
		log.Info("Context was canceled. Initialize WunderNode shutdown ....")
	}

	gracefulTimeoutDur := time.Duration(gracefulTimeout) * time.Second
	log.Info("Graceful shutdown WunderNode ...", abstractlogger.String("gracefulTimeout", gracefulTimeoutDur.String()))
	ctx, cancel := context.WithTimeout(ctx, gracefulTimeoutDur)
	defer cancel()

	if err := n.Shutdown(ctx); err != nil {
		log.Error("Error during WunderNode shutdown", abstractlogger.Error(err))
	}

	log.Info("WunderNode shutdown complete")
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().StringVar(&listenAddr, "listen-addr", "localhost:9991", "listen-addr is the host:port combination, WunderGraph should listen on.")
	startCmd.Flags().StringVarP(&configJsonFilename, "config", "c", "wundergraph.config.json", "filename to the generated wundergraph config")
	startCmd.Flags().IntVar(&middlewareListenPort, "middleware-listen-port", 9992, "middleware-listen-port is the port which the WunderGraph middleware will bind to")
	startCmd.Flags().IntVar(&gracefulTimeout, "graceful-timeout", 10, "graceful-timeout is the time in seconds the server has to graceful shutdown")
	startCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "starts the engine without the server")
	startCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "enables GraphQL introspection on /%api%/%main%/graphql")
	startCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "disables authentication to enforce https redirects")
	startCmd.Flags().StringVar(&configEntryPointFilename, "entrypoint", "wundergraph.config.ts", "filename of node config")
	startCmd.Flags().StringVar(&serverEntryPointFilename, "serverEntryPoint", "wundergraph.server.ts", "filename of the server config")
	startCmd.Flags().BoolVar(&enableManagedMode, "managed", false, "start WunderNode in managed mode")
}
