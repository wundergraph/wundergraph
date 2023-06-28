package telemetry

import (
	"fmt"
	"strings"

	"github.com/spf13/cobra"
)

const (
	DATASOURCE_USAGE_METRIC_NAME = "WG_DATASOURCE_USAGE"
	FEATURE_USAGE_METRIC_NAME    = "WG_FEATURE_USAGE"
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
