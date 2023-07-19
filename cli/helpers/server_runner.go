package helpers

import (
	"fmt"

	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

type HooksServerRunConfig struct {
	WunderGraphDirAbs string
	ServerScriptFile  string
	Env               []string
	LogLevel          string
	Production        bool
	Debug             bool
	Output            *scriptrunner.OutputConfig
}

func NewHooksServerRunner(log *zap.Logger, cfg *HooksServerRunConfig) *scriptrunner.ScriptRunner {
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

	hookServerRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
		Name:          "hooks-server-runner",
		Executable:    "node",
		AbsWorkingDir: cfg.WunderGraphDirAbs,
		ScriptArgs:    scriptArgs,
		Logger:        log,
		ScriptEnv:     append(cfg.Env, hooksEnv...),
		Output:        cfg.Output,
	})

	return hookServerRunner
}
