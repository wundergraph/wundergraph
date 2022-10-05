package helpers

import (
	"fmt"
	"os"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

// CliEnv expands env with cli specific env vars - to been able to resend it back to cli
// from js SDK
func CliEnv(cliLogLevel string, jsonLogging bool) []string {
	return append(
		os.Environ(),
		fmt.Sprintf("%s=%s", wgpb.WgEnvironmentVariable_WG_CLI_LOG_LEVEL, cliLogLevel),
		fmt.Sprintf("%s=%t", wgpb.WgEnvironmentVariable_WG_CLI_LOG_JSON, jsonLogging))
}
