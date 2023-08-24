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
	Log               string
	Production        bool
	DebugBindAddress  string
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

	// Align the log configuration
	if cfg.Log != "" {
		hooksEnv = append(hooksEnv, fmt.Sprintf("WG_LOG=%s", cfg.Log))
	}

	var scriptArgs []string

	if cfg.Debug {
		scriptArgs = append(scriptArgs, "--inspect="+cfg.DebugBindAddress)
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
