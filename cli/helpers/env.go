package helpers

import (
	"fmt"
	"os"
)

const (
	WgLogPrettyEnvKey = "WG_LOG_PRETTY"
)

// CliEnv expands env with cli specific env vars - to been able to resend it back to cli
// from js SDK
func CliEnv(flags RootFlags) []string {
	return append(
		os.Environ(),
		fmt.Sprintf("%s=%s", "WG_CLI_LOG_LEVEL", flags.CliLogLevel),
		fmt.Sprintf("%s=%t", WgLogPrettyEnvKey, flags.PrettyLogs),
		fmt.Sprintf("%s=%t", "WG_DEBUG_MODE", flags.DebugMode))
}
