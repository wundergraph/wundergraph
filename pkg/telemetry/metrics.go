package telemetry

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
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

func DataSourceMetricName(name string) string {
	return fmt.Sprintf("DATA_SOURCE_%s", name)
}
