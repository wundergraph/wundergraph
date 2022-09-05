package runners

import (
	"fmt"
	"os"

	"github.com/jensneuse/abstractlogger"

	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

type ServerRunConfig struct {
	WunderGraphDirAbs string
	ServerScriptFile  string
}

func NewServerRunner(log abstractlogger.Logger, cfg *ServerRunConfig) *scriptrunner.ScriptRunner {
	hooksEnv := []string{
		"START_HOOKS_SERVER=true",
		fmt.Sprintf("WG_ABS_DIR=%s", cfg.WunderGraphDirAbs),
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
