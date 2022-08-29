package runners

import (
	"fmt"
	"os"

	"github.com/jensneuse/abstractlogger"

	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

type ServerRunConfig struct {
	EnableDebugMode   bool
	WunderGraphDirAbs string
	ServerListenPort  int
	ServerHost        string
	NodeUrl           string
	ServerScriptFile  string
}

func NewServerRunner(log abstractlogger.Logger, cfg *ServerRunConfig) *scriptrunner.ScriptRunner {
	hooksEnv := []string{
		"START_HOOKS_SERVER=true",
		fmt.Sprintf("WG_ABS_DIR=%s", cfg.WunderGraphDirAbs),
		fmt.Sprintf("WG_SERVER_HOST=%s", cfg.ServerHost),
		fmt.Sprintf("WG_SERVER_PORT=%d", cfg.ServerListenPort),
		fmt.Sprintf("WG_NODE_URL=%s", cfg.NodeUrl),
	}

	if cfg.EnableDebugMode {
		hooksEnv = append(hooksEnv, "LOG_LEVEL=debug")
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
