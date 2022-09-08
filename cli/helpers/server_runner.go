package helpers

import (
	"fmt"
	"os"

	"github.com/jensneuse/abstractlogger"

	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

type ServerRunConfig struct {
	WunderGraphDirAbs string
	ServerScriptFile  string
	Production        bool
}

func NewServerRunner(log abstractlogger.Logger, cfg *ServerRunConfig) *scriptrunner.ScriptRunner {
	hooksEnv := []string{
		"START_HOOKS_SERVER=true",
		fmt.Sprintf("WG_ABS_DIR=%s", cfg.WunderGraphDirAbs),
	}

	if cfg.Production {
		hooksEnv = append(hooksEnv, "NODE_ENV=production")
	}

	hookServerRunner := scriptrunner.NewScriptRunner(&scriptrunner.Config{
		Name:          "hooks-server-runner",
		Executable:    "node",
		AbsWorkingDir: cfg.WunderGraphDirAbs,
		ScriptArgs:    []string{cfg.ServerScriptFile},
		Logger:        log,
		ScriptEnv:     append(os.Environ(), hooksEnv...),
	})

	return hookServerRunner
}
