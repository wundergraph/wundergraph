package telemetry

import (
	"bytes"
	"os/exec"
	"strings"
)

func gitRepoURLHash() (string, error) {
	cmd := exec.Command("git", "config", "--local", "--get", "remote.origin.url")
	var stdout bytes.Buffer
	cmd.Stdout = &stdout
	if err := cmd.Run(); err != nil {
		return "", err
	}
	projectID := strings.TrimSpace(stdout.String())
	return Hash(projectID)
}
