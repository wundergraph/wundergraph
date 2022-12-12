package telemetry

import (
	"fmt"
	"github.com/spf13/cobra"
	"strings"
)

func CmdUsageMetricName(cmdName string) string {
	return fmt.Sprintf("%s_CMD_USAGE", strings.ToUpper(cmdName))
}

func CmdDurationMetricName(cmdName string) string {
	return fmt.Sprintf("%s_CMD_DURATION", strings.ToUpper(cmdName))
}

func CobraFullCommandPathMetricName(cmd *cobra.Command) string {
	return strings.ToUpper(strings.Join(strings.Split(cmd.CommandPath(), " "), "_"))
}

func CmdMetricNameWithParent(parentCmdName, cmdName string) string {
	return strings.Join([]string{strings.ToUpper(parentCmdName), strings.ToUpper(cmdName)}, "_")
}
