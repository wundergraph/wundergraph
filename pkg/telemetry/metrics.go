package telemetry

import (
	"fmt"
	"strings"
)

func CmdUsageMetricName(cmdName string) string {
	return fmt.Sprintf("WUNDERCTL_%s_CMD_USAGE", strings.ToUpper(cmdName))
}

func CmdDurationMetricName(cmdName string) string {
	return fmt.Sprintf("WUNDERCTL_%s_CMD_DURATION", strings.ToUpper(cmdName))
}

func CmdMetricNameWithParent(parentCmdName, cmdName string) string {
	return strings.Join([]string{strings.ToUpper(parentCmdName), strings.ToUpper(cmdName)}, "_")
}
