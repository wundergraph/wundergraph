package telemetry

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"io"
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
	hash := sha256.New()
	if _, err := io.Copy(hash, strings.NewReader(projectID)); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}
