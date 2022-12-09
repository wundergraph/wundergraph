package commands

import (
	"errors"
	"fmt"
	"github.com/fatih/color"
	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"github.com/wundergraph/wundergraph/pkg/telemetry"
	"go.uber.org/zap"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/config"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/node"
)

const (
	configJsonFilename       = "wundergraph.config.json"
	configEntryPointFilename = "wundergraph.config.ts"
	serverEntryPointFilename = "wundergraph.server.ts"

	wunderctlBinaryPathEnvKey = "WUNDERCTL_BINARY_PATH"

	defaultNodeGracefulTimeoutSeconds = 10
)

var (
	BuildInfo                node.BuildInfo
	GitHubAuthDemo           node.GitHubAuthDemo
	TelemetryClient          telemetry.Client
	TelemetryDurationTracker *telemetry.DurationTracker
	DotEnvFile               string
	log                      *zap.Logger
	serviceToken             string
	_wunderGraphDirConfig    string
	disableCache             bool
	clearCache               bool

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
	Long: `wunderctl is the cli to manage, build and debug your WunderGraph applications

Simply running "wunderctl" will check the wundergraph.manifest.json in the current directory and install all dependencies. 

wunderctl is gathering anonymous usage data so that we can better understand how it's being used and improve it.
You can opt out of this by setting the following environment variable: WUNDERGRAPH_DISABLE_METRICS
`,
	PersistentPostRun: func(cmd *cobra.Command, args []string) {
		switch cmd.Name() {
		case UpCmdName:
			TelemetryClient.Gauge(telemetry.WunderctlUpCmdDuration, TelemetryDurationTracker.Stop(telemetry.WunderctlUpCmdDuration).Seconds())
		}

		err := TelemetryClient.Flush(telemetry.MetricClientInfo{
			IsDevelopment:    false,
			WunderctlVersion: BuildInfo.Version,
			IsCI:             os.Getenv("CI") != "",
			AnonymousID:      viper.GetString("anonymousid"),
		})
		if err != nil {
			log.Debug("failed to flush telemetry", zap.Error(err))
		}
	},
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		TelemetryClient = telemetry.NewClient(viper.GetString("API_URL"), telemetry.WithTimeout(3))
		TelemetryDurationTracker = telemetry.NewDurationTracker()

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

			TelemetryDurationTracker.Start(telemetry.WunderctlUpCmdDuration)
			TelemetryClient.Increment(telemetry.WunderctlUpCmdUsage)
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
				log.Fatal("error loading env file",
					zap.Error(err))
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

		return nil
	},
}

type BuildTimeConfig struct {
	DefaultApiEndpoint string
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute(buildInfo node.BuildInfo, githubAuthDemo node.GitHubAuthDemo) {
	BuildInfo = buildInfo
	GitHubAuthDemo = githubAuthDemo
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
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
	config.InitConfig()

	viper.SetDefault("API_URL", "https://gateway.wundergraph.com")

	rootCmd.PersistentFlags().StringVarP(&rootFlags.CliLogLevel, "cli-log-level", "l", "info", "sets the CLI log level")
	rootCmd.PersistentFlags().StringVarP(&DotEnvFile, "env", "e", ".env", "allows you to set environment variables from an env file")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.DebugMode, "debug", false, "enables the debug mode so that all requests and responses will be logged")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.PrettyLogs, "pretty-logging", false, "switches to human readable format")
	rootCmd.PersistentFlags().StringVar(&_wunderGraphDirConfig, "wundergraph-dir", files.WunderGraphDirName, "path to your .wundergraph directory")
	rootCmd.PersistentFlags().BoolVar(&disableCache, "no-cache", false, "disables local caches")
	rootCmd.PersistentFlags().BoolVar(&clearCache, "clear-cache", false, "clears local caches during startup")
}
