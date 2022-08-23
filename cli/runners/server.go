package runners

import (
	"fmt"
	"os"

	"github.com/jensneuse/abstractlogger"

	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

type ServerRunConfig struct {
	EnableDebugMode      bool
	WunderGraphDirAbs    string
	HooksJWT             string
	MiddlewareListenPort int
	ListenAddr           string
	ServerScriptFile     string
}

func NewServerRunner(log abstractlogger.Logger, cfg *ServerRunConfig) *scriptrunner.ScriptRunner {
	hooksEnv := []string{
		"START_HOOKS_SERVER=true",
		fmt.Sprintf("WG_ABS_DIR=%s", cfg.WunderGraphDirAbs),
		fmt.Sprintf("HOOKS_TOKEN=%s", cfg.HooksJWT),
		fmt.Sprintf("WG_MIDDLEWARE_PORT=%d", cfg.MiddlewareListenPort),
		fmt.Sprintf("WG_LISTEN_ADDR=%s", cfg.ListenAddr),
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
