package helpers

import (
	"context"
	"errors"
	"fmt"
	"net"
	"syscall"

	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

const (
	configJsonFilename = "wundergraph.config.json"
)

type HooksServerRunConfig struct {
	WunderGraphDirAbs string
	ServerScriptFile  string
	Env               []string
	LogLevel          string
	Production        bool
	Debug             bool
	LogStreaming      bool
}

type HooksServerRunner struct {
	runner         *scriptrunner.ScriptRunner
	wunderGraphDir string
}

// WaitUntilReady waits until the hooks server is ready and listening on its port.
// If the server is ready, it returns nil. If the context is cancelled, it returns
// the context's Err().
func (r *HooksServerRunner) WaitUntilReady(ctx context.Context) error {
	configJsonPath := ConfigFilePath(r.wunderGraphDir)
	serverAddr, err := ServerAddressFromConfig(configJsonPath)
	if err != nil {
		return fmt.Errorf("could not determine hooks server address: %w", err)
	}
	dialer := &net.Dialer{}
	for {
		conn, err := dialer.DialContext(ctx, "tcp", serverAddr)
		if err != nil {
			if errors.Is(err, syscall.ECONNREFUSED) {
				continue
			}
			return err
		}
		conn.Close()
		break
	}
	return nil
}

// Run starts the hooks server, blocks awaiting for it to exit and returns
// any errors returned by the script runner.
func (r *HooksServerRunner) Run(ctx context.Context) error {
	<-r.runner.Run(ctx)
	return r.runner.Error()
}

func NewHooksServerRunner(log *zap.Logger, cfg *HooksServerRunConfig) *HooksServerRunner {
	hooksEnv := []string{
		"START_HOOKS_SERVER=true",
		fmt.Sprintf("WG_DIR_ABS=%s", cfg.WunderGraphDirAbs),
	}

	if cfg.Production {
		hooksEnv = append(hooksEnv, "NODE_ENV=production")
	}

	// Align the log level
	if cfg.LogLevel != "" {
		hooksEnv = append(hooksEnv, fmt.Sprintf("WG_LOG_LEVEL=%s", cfg.LogLevel))
	}

	var scriptArgs []string

	if cfg.Debug {
		scriptArgs = append(scriptArgs, "--inspect")
	}
	scriptArgs = append(scriptArgs, cfg.ServerScriptFile)

	runner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
		Name:          "hooks-server-runner",
		Executable:    "node",
		AbsWorkingDir: cfg.WunderGraphDirAbs,
		ScriptArgs:    scriptArgs,
		Logger:        log,
		ScriptEnv:     append(cfg.Env, hooksEnv...),
		Streaming:     cfg.LogStreaming,
	})

	return &HooksServerRunner{
		runner:         runner,
		wunderGraphDir: cfg.WunderGraphDirAbs,
	}
}
