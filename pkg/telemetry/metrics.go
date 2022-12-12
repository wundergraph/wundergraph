package telemetry

import (
	"fmt"
	"github.com/spf13/cobra"
	"strings"
)

func UsageMetricSuffix(cmdName string) string {
	return fmt.Sprintf("%s_CMD_USAGE", strings.ToUpper(cmdName))
}

func DurationMetricSuffix(cmdName string) string {
	return fmt.Sprintf("%s_CMD_DURATION", strings.ToUpper(cmdName))
}

func CobraFullCommandPathMetricName(cmd *cobra.Command) string {
	return strings.ToUpper(strings.Join(strings.Split(cmd.CommandPath(), " "), "_"))
}
