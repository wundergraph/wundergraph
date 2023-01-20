package commands

import (
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"github.com/fatih/color"
	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/config"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/telemetry"
)

const (
	configJsonFilename       = "wundergraph.config.json"
	configEntryPointFilename = "wundergraph.config.ts"
	serverEntryPointFilename = "wundergraph.server.ts"

	wunderctlBinaryPathEnvKey = "WUNDERCTL_BINARY_PATH"

	defaultNodeGracefulTimeoutSeconds = 10
)

var (
	BuildInfo             node.BuildInfo
	GitHubAuthDemo        node.GitHubAuthDemo
	TelemetryClient       telemetry.Client
	DotEnvFile            string
	log                   *zap.Logger
	cmdDurationMetric     telemetry.DurationMetric
	_wunderGraphDirConfig string
	disableCache          bool
	clearCache            bool

	rootFlags helpers.RootFlags

	red    = color.New(color.FgHiRed)
	green  = color.New(color.FgHiGreen)
	blue   = color.New(color.FgHiBlue)
	yellow = color.New(color.FgHiYellow)
	cyan   = color.New(color.FgHiCyan)
	white  = color.New(color.FgHiWhite)
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "wunderctl",
	Short: "wunderctl is the cli to manage, build and debug your WunderGraph applications",
	Long:  `wunderctl is the cli to manage, build and debug your WunderGraph applications.`,
	// Don't show usage on error
	SilenceUsage: true,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		switch cmd.Name() {
		// skip any setup to avoid logging anything
		// because the command output data on stdout
		case LoadOperationsCmdName:
			return nil
			// up command has a different default for global pretty logging
			// we can't overwrite the default value in the init function because
			// it would overwrite the default value for all other commands
		case UpCmdName:
			rootFlags.PrettyLogs = upCmdPrettyLogging
		}

		if rootFlags.DebugMode {
			// override log level to debug
			rootFlags.CliLogLevel = "debug"
		}

		logLevel, err := logging.FindLogLevel(rootFlags.CliLogLevel)
		if err != nil {
			return err
		}

		log = logging.
			New(rootFlags.PrettyLogs, rootFlags.DebugMode, logLevel).
			With(zap.String("component", "@wundergraph/wunderctl"))

		err = godotenv.Load(DotEnvFile)
		if err != nil {
			if _, ok := err.(*fs.PathError); ok {
				log.Debug("starting without env file")
			} else {
				log.Error("error loading env file",
					zap.Error(err))
				return err
			}
		} else {
			log.Debug("env file successfully loaded",
				zap.String("file", DotEnvFile),
			)
		}

		if clearCache {
			wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
			if err != nil {
				return err
			}
			cacheDir := filepath.Join(wunderGraphDir, "cache")
			if err := os.RemoveAll(cacheDir); err != nil && !errors.Is(err, os.ErrNotExist) {
				return err
			}
		}

		// Check if we want to track telemetry for this command
		if rootFlags.Telemetry && cmd.Annotations["telemetry"] == "true" {
			TelemetryClient = telemetry.NewClient(
				viper.GetString("API_URL"),
				telemetry.MetricClientInfo{
					WunderctlVersion: BuildInfo.Version,
					IsCI:             os.Getenv("CI") != "" || os.Getenv("ci") != "",
					AnonymousID:      viper.GetString("anonymousid"),
				},
				telemetry.WithTimeout(3*time.Second),
				telemetry.WithLogger(log),
				telemetry.WithDebug(rootFlags.TelemetryDebugMode),
			)

			cmdMetricName := telemetry.CobraFullCommandPathMetricName(cmd)

			metricDurationName := telemetry.DurationMetricSuffix(cmdMetricName)
			cmdDurationMetric = telemetry.NewDurationMetric(metricDurationName)

			metricUsageName := telemetry.UsageMetricSuffix(cmdMetricName)
			cmdUsageMetric := telemetry.NewUsageMetric(metricUsageName)

			// Send telemetry in a goroutine to not block the command
			go func() {
				err := TelemetryClient.Send([]telemetry.Metric{cmdUsageMetric})

				// AddMetric the usage of the command immediately
				if rootFlags.TelemetryDebugMode {
					if err != nil {
						log.Error("Could not send telemetry data", zap.Error(err))
					} else {
						log.Info("Telemetry data sent")
					}
				}
			}()
		}

		return nil
	},
}

type BuildTimeConfig struct {
	DefaultApiEndpoint string
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute(buildInfo node.BuildInfo, githubAuthDemo node.GitHubAuthDemo) {
	var err error

	defer func() {
		// In case of a panic or error we want to flush the telemetry data
		if r := recover(); r != nil || err != nil {
			FlushTelemetry()
			os.Exit(1)
		} else {
			FlushTelemetry()
			os.Exit(0)
		}
	}()

	BuildInfo = buildInfo
	GitHubAuthDemo = githubAuthDemo
	err = rootCmd.Execute()
}

func FlushTelemetry() {
	if TelemetryClient != nil && rootFlags.Telemetry && cmdDurationMetric != nil {
		err := TelemetryClient.Send([]telemetry.Metric{cmdDurationMetric()})
		if rootFlags.TelemetryDebugMode {
			if err != nil {
				log.Error("Could not send telemetry data", zap.Error(err))
			} else {
				log.Info("Telemetry data sent")
			}
		}
	}
}

// wunderctlBinaryPath() returns the path to the currently executing parent wunderctl
// command which is then passed via wunderctlBinaryPathEnvKey to subprocesses. This
// ensures than when the SDK calls back into wunderctl, the same copy is always used.
func wunderctlBinaryPath() string {
	// Check if a parent wunderctl set this for us
	path, isSet := os.LookupEnv(wunderctlBinaryPathEnvKey)
	if !isSet {
		// Variable is not set, find out our path and set it
		exe, err := os.Executable()
		if err == nil {
			path = exe
		}
	}
	return path
}

func init() {
	_, isTelemetryDisabled := os.LookupEnv("WG_TELEMETRY_DISABLED")
	_, isTelemetryDebugEnabled := os.LookupEnv("WG_TELEMETRY_DEBUG")

	config.InitConfig(!isTelemetryDisabled)

	// Can be overwritten by WG_API_URL=<url> env variable
	viper.SetDefault("API_URL", "https://gateway.wundergraph.com")

	rootCmd.PersistentFlags().StringVarP(&rootFlags.CliLogLevel, "cli-log-level", "l", "info", "sets the CLI log level")
	rootCmd.PersistentFlags().StringVarP(&DotEnvFile, "env", "e", ".env", "allows you to set environment variables from an env file")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.DebugMode, "debug", false, "enables the debug mode so that all requests and responses will be logged")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.Telemetry, "telemetry", !isTelemetryDisabled, "enables telemetry. Telemetry allows us to accurately gauge WunderGraph feature usage, pain points, and customization across all users.")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.TelemetryDebugMode, "telemetry-debug", isTelemetryDebugEnabled, "enables the debug mode for telemetry. Understand what telemetry is being sent to us.")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.PrettyLogs, "pretty-logging", false, "switches to human readable format")
	rootCmd.PersistentFlags().StringVar(&_wunderGraphDirConfig, "wundergraph-dir", ".", "directory of your wundergraph.config.ts")
	rootCmd.PersistentFlags().BoolVar(&disableCache, "no-cache", false, "disables local caches")
	rootCmd.PersistentFlags().BoolVar(&clearCache, "clear-cache", false, "clears local caches during startup")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.Pretty, "pretty", false, "pretty print output")
}
