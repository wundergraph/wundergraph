package runners

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jensneuse/abstractlogger"

	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/wundernodeconfig"
)

type NodeRunConfig struct {
	BuildInfo              node.BuildInfo
	EnableDebugMode        bool
	HooksSecret            []byte
	ListenAddr             string
	ConfigFilePath         string
	GracefulTimeoutSeconds int

	DisableForceHttpsRedirects bool
	EnableIntrospection        bool
	GitHubAuthDemo             node.GitHubAuthDemo
}

type NodeRunner struct {
	quit chan os.Signal
	log  abstractlogger.Logger
}

func NewNodeRunner(log abstractlogger.Logger) *NodeRunner {
	quit := make(chan os.Signal, 2)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	return &NodeRunner{
		log:  log,
		quit: quit,
	}
}

func (r *NodeRunner) Run(ctx context.Context, runCfg *NodeRunConfig) error {
	cfg := &wundernodeconfig.Config{
		Server: &wundernodeconfig.ServerConfig{
			ListenAddr: runCfg.ListenAddr,
		},
	}

	configFileChangeChan := make(chan struct{})
	n := node.New(ctx, runCfg.BuildInfo, cfg, r.log)

	go func() {
		err := n.StartBlocking(
			node.WithConfigFileChange(configFileChangeChan),
			node.WithFileSystemConfig(runCfg.ConfigFilePath),
			node.WithHooksSecret(runCfg.HooksSecret),
			node.WithDebugMode(runCfg.EnableDebugMode),
			node.WithForceHttpsRedirects(!runCfg.DisableForceHttpsRedirects),
			node.WithIntrospection(runCfg.EnableIntrospection),
			node.WithGitHubAuthDemo(runCfg.GitHubAuthDemo),
		)
		if err != nil {
			r.log.Fatal("startBlocking", abstractlogger.Error(err))
		}
	}()

	// trigger server reload after initial config build
	// because no fs event is fired as build is already done
	configFileChangeChan <- struct{}{}

	r.handleGracefulShutdown(ctx, n, runCfg)

	return nil
}

func (r *NodeRunner) handleGracefulShutdown(ctx context.Context, n *node.Node, runCfg *NodeRunConfig) {
	select {
	case quitSignal := <-r.quit:
		r.log.Info("Received interrupt quitSignal. Initialize WunderNode shutdown ...",
			abstractlogger.String("quitSignal", quitSignal.String()),
		)
	case <-ctx.Done():
		r.log.Info("Context was canceled. Initialize WunderNode shutdown ....")
	}

	gracefulTimeoutDur := time.Duration(runCfg.GracefulTimeoutSeconds) * time.Second
	r.log.Info("Graceful shutdown WunderNode ...", abstractlogger.String("gracefulTimeout", gracefulTimeoutDur.String()))
	shutdownCtx, cancel := context.WithTimeout(ctx, gracefulTimeoutDur)
	defer cancel()

	if err := n.Shutdown(shutdownCtx); err != nil {
		r.log.Error("Error during WunderNode shutdown", abstractlogger.Error(err))
	}

	r.log.Info("WunderNode shutdown complete")
}
