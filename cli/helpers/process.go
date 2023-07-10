package helpers

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"syscall"

	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"

	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

func ServerPortFromConfig(configJsonPath string) (int, error) {
	data, err := os.ReadFile(configJsonPath)
	if err != nil {
		return 0, err
	}

	if len(data) == 0 {
		return 0, errors.New("config file is empty")
	}

	var graphConfig wgpb.WunderGraphConfiguration
	if err := proto.Unmarshal(data, &graphConfig); err != nil {
		return 0, fmt.Errorf("error decoding config: %w", err)
	}
	if graphConfig.Api != nil && graphConfig.Api.ServerOptions != nil {
		variable := graphConfig.Api.ServerOptions.GetListen().GetPort()
		if variable != nil {
			return loadvariable.Int(variable)
		}
	}
	return 0, errors.New("configuration is invalid")
}

// KillExistingHooksProcess kills the existing hooks process before we start the new one
// some IDEs, like Goland, don't send a SIGINT to the process group
// this leads to the middleware hooks server (sub-process) not being killed
// on subsequent runs of the up command, we're not able to listen on the same port
func KillExistingHooksProcess(serverListenPort int, log *zap.Logger) {
	if runtime.GOOS == "windows" {
		command := fmt.Sprintf("(Get-NetTCPConnection -LocalPort %d).OwningProcess -Force", serverListenPort)
		execCmd(exec.Command("Stop-Process", "-Id", command), serverListenPort, log)
	} else {
		command := fmt.Sprintf("lsof -i tcp:%d | grep LISTEN | awk '{print $2}' | xargs kill -9", serverListenPort)
		execCmd(exec.Command("bash", "-c", command), serverListenPort, log)
	}
}

func execCmd(cmd *exec.Cmd, serverListenPort int, log *zap.Logger) {
	var waitStatus syscall.WaitStatus
	if err := cmd.Run(); err != nil {
		log.Debug(fmt.Sprintf("Error: %s", err.Error()))

		if exitError, ok := err.(*exec.ExitError); ok {
			waitStatus = exitError.Sys().(syscall.WaitStatus)
			log.Debug(fmt.Sprintf("Error during port killing (exit code: %s)\n", []byte(fmt.Sprintf("%d", waitStatus.ExitStatus()))))
		}
	} else {
		waitStatus = cmd.ProcessState.Sys().(syscall.WaitStatus)
		log.Debug("Successfully killed existing middleware process",
			zap.Int("port", serverListenPort),
		)
	}
}
