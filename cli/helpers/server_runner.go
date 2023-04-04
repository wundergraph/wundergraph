package helpers

import (
	"fmt"

	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

type ServerRunConfig struct {
	WunderGraphDirAbs string
	ServerScriptFile  string
	Env               []string
	Production        bool
	Debug             bool
}

func NewServerRunner(log *zap.Logger, cfg *ServerRunConfig) *scriptrunner.ScriptRunner {
	hooksEnv := []string{
		"START_HOOKS_SERVER=true",
		fmt.Sprintf("WG_DIR_ABS=%s", cfg.WunderGraphDirAbs),
	}

	if cfg.Production {
		hooksEnv = append(hooksEnv, "NODE_ENV=production")
	}

	scriptArgs := make([]string, 0, 2)
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
	})

	return hookServerRunner
}
