package commands

import (
	"context"
	"fmt"
	"io/fs"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/fatih/color"
	"github.com/joho/godotenv"
	"github.com/mattn/go-isatty"
	natsServer "github.com/nats-io/nats-server/v2/server"
	natsTest "github.com/nats-io/nats-server/v2/test"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/wundergraph/wundergraph/cli/helpers"
	"github.com/wundergraph/wundergraph/pkg/config"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/telemetry"
)

const (
	serializedConfigFilename = "wundergraph.wgconfig"
	serverEntryPointFilename = "wundergraph.server.ts"

	wunderctlBinaryPathEnvKey = "WUNDERCTL_BINARY_PATH"

	defaultNodeGracefulTimeoutSeconds = 10

	// Telemetry requires the configuration to be generated, so
	// we need  need to wait a bit for it
	telemetryReloadWait     = 100 * time.Millisecond
	maxTelemetryLoadRetries = 20

	natsDisableEmbeddedServerKey = "WG_DISABLE_EMBEDDED_NATS"
)

var (
	BuildInfo             node.BuildInfo
	GitHubAuthDemo        node.GitHubAuthDemo
	TelemetryClient       telemetry.Client
	DotEnvFile            string
	log                   *zap.Logger
	cmdDurationMetric     telemetry.DurationMetric
	zapLogLevel           zapcore.Level
	_wunderGraphDirConfig string
	// otelBatchTimeout is the maximum timeout before a batch of otel data is sent
	// By default it is 5 seconds but for CI and debugging purposes it should be set much lower
	otelBatchTimeout time.Duration

	rootFlags helpers.RootFlags

	red    = color.New(color.FgHiRed)
	green  = color.New(color.FgHiGreen)
	blue   = color.New(color.FgHiBlue)
	yellow = color.New(color.FgHiYellow)
	cyan   = color.New(color.FgHiCyan)
	white  = color.New(color.FgHiWhite)
)

func sendTelemetry(cmd *cobra.Command) error {
	// Check if we want to track telemetry for this command
	if !rootFlags.Telemetry || !telemetry.HasAnnotations(telemetry.AnnotationCommand, cmd.Annotations) {
		return nil
	}
	cmdMetricName := telemetry.CobraFullCommandPathMetricName(cmd)

	metricDurationName := telemetry.DurationMetricSuffix(cmdMetricName)
	cmdDurationMetric = telemetry.NewDurationMetric(metricDurationName)

	metricUsageName := telemetry.UsageMetricSuffix(cmdMetricName)
	cmdUsageMetric := telemetry.NewUsageMetric(metricUsageName)

	metrics := []*telemetry.Metric{cmdUsageMetric}

	wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
	if err != nil {
		return err
	}

	var clientInfo *telemetry.MetricClientInfo
	retries := 0
	for {
		clientInfo, err = telemetry.NewClientInfo(BuildInfo.Version, viper.GetString("anonymousid"), wunderGraphDir)
		if err != nil {
			if os.IsNotExist(err) {
				// Configuration is not yet available, wait a bit to try to report all telemetry
				if retries < maxTelemetryLoadRetries {
					retries++
					time.Sleep(telemetryReloadWait)
					continue
				}
			}
			return err
		}
		break
	}

	// Check if this command should also other telemetry data
	if telemetry.HasAnnotations(telemetry.AnnotationDataSources, cmd.Annotations) || telemetry.HasAnnotations(telemetry.AnnotationFeatures, cmd.Annotations) {
		if telemetry.HasAnnotations(telemetry.AnnotationDataSources, cmd.Annotations) {
			dataSourcesMetrics, err := telemetry.DataSourceMetrics(wunderGraphDir)
			if err != nil {
				if rootFlags.TelemetryDebugMode {
					log.Error("could not generate data sources telemetry data", zap.Error(err))

				}
			}
			metrics = append(metrics, dataSourcesMetrics...)
		}

		if telemetry.HasAnnotations(telemetry.AnnotationFeatures, cmd.Annotations) {
			featureMetrics, err := telemetry.FeatureMetrics(wunderGraphDir)
			if err != nil {
				if rootFlags.TelemetryDebugMode {
					log.Error("could not generate features telemetry data", zap.Error(err))

				}
			}
			metrics = append(metrics, featureMetrics...)
		}
	}

	TelemetryClient = telemetry.NewClient(
		viper.GetString("API_URL"), clientInfo,
		telemetry.WithTimeout(3*time.Second),
		telemetry.WithLogger(log),
		telemetry.WithDebug(rootFlags.TelemetryDebugMode),
		telemetry.WithAuthToken(os.Getenv("WG_TELEMETRY_AUTH_TOKEN")),
	)

	return TelemetryClient.Send(metrics)
}

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
		}

		if !isatty.IsTerminal(os.Stdout.Fd()) {
			// Always use JSON when not in a terminal
			rootFlags.PrettyLogs = false
		}

		if rootFlags.DebugMode {
			// override log level to debug in debug mode
			rootFlags.CliLogLevel = "debug"
		}

		logLevel, err := logging.FindLogLevel(rootFlags.CliLogLevel)
		if err != nil {
			return err
		}
		zapLogLevel = logLevel

		log = logging.
			New(rootFlags.PrettyLogs, rootFlags.DebugMode, zapLogLevel).
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

		// Send telemetry in a goroutine to not block the command
		go func() {
			err := sendTelemetry(cmd)

			// AddMetric the usage of the command immediately
			if rootFlags.TelemetryDebugMode {
				if err != nil {
					log.Error("Could not send telemetry data", zap.Error(err))
				} else {
					log.Info("Telemetry data sent")
				}
			}
		}()

		return nil
	},
}

type BuildTimeConfig struct {
	DefaultApiEndpoint string
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute(buildInfo node.BuildInfo, githubAuthDemo node.GitHubAuthDemo) {
	// Instead of recover()'ing, use a boolean that we set to false
	// at the of the function to keep track of whether we've panic()'ed
	// or not. This allows us to set an appropriate exit code while
	// showing the whole panic stack, which might be useful for fixing the
	// problem.
	didPanic := true
	var err error
	defer func() {
		// In case of a panic or error we want to flush the telemetry data
		FlushTelemetry()
		if didPanic || err != nil {
			if err != nil {
				fmt.Fprintf(os.Stderr, "%s\n", err)
			}
			os.Exit(1)
		}
	}()

	BuildInfo = buildInfo
	GitHubAuthDemo = githubAuthDemo
	err = rootCmd.Execute()
	didPanic = false
}

func FlushTelemetry() {
	if TelemetryClient != nil && rootFlags.Telemetry && cmdDurationMetric != nil {
		err := TelemetryClient.Send([]*telemetry.Metric{cmdDurationMetric()})
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

// commonScriptEnv returns environment variables that all script invocations should use
func commonScriptEnv(wunderGraphDir string) []string {
	cacheDir, err := helpers.LocalWunderGraphCacheDir(wunderGraphDir)
	if err != nil {
		log.Warn("could not determine cache directory", zap.Error(err))
	}
	return []string{
		fmt.Sprintf("WUNDERGRAPH_CACHE_DIR=%s", cacheDir),
		fmt.Sprintf("WG_DIR_ABS=%s", wunderGraphDir),
		fmt.Sprintf("%s=%s", wunderctlBinaryPathEnvKey, wunderctlBinaryPath()),
		fmt.Sprintf("WUNDERCTL_VERSION=%s", BuildInfo.Version),
	}
}

// cacheConfigurationEnv returns the environment variables required to configure the
// cache in the SDK side
func cacheConfigurationEnv(isCacheEnabled bool) []string {
	return []string{
		fmt.Sprintf("WG_ENABLE_INTROSPECTION_CACHE=%t", isCacheEnabled),
	}
}

type configScriptEnvOptions struct {
	WunderGraphDir                string
	RootFlags                     helpers.RootFlags
	EnableCache                   bool
	DefaultPollingIntervalSeconds int
	FirstRun                      bool
}

// configScriptEnv returns the environment variables that scripts running the SDK configuration
// must use
func configScriptEnv(opts configScriptEnvOptions) []string {
	var env []string
	env = append(env, helpers.CliEnv(opts.RootFlags)...)
	env = append(env, commonScriptEnv(opts.WunderGraphDir)...)
	env = append(env, cacheConfigurationEnv(opts.EnableCache)...)
	env = append(env, "WG_PRETTY_GRAPHQL_VALIDATION_ERRORS=true")
	env = append(env, fmt.Sprintf("WG_DATA_SOURCE_DEFAULT_POLLING_INTERVAL_SECONDS=%d", opts.DefaultPollingIntervalSeconds))
	if opts.FirstRun {
		// WG_INTROSPECTION_CACHE_SKIP=true causes the cache to try to load the remote data on the first run
		env = append(env, "WG_INTROSPECTION_CACHE_SKIP=true")
	}
	return env
}

func init() {
	_, isTelemetryDisabled := os.LookupEnv("WG_TELEMETRY_DISABLED")
	_, isTelemetryDebugEnabled := os.LookupEnv("WG_TELEMETRY_DEBUG")
	telemetryAnonymousID := os.Getenv("WG_TELEMETRY_ANONYMOUS_ID")

	if otelBatchTimeoutEnv, ok := os.LookupEnv("WG_OTEL_BATCH_TIMEOUT_MS"); ok {
		ms, err := strconv.Atoi(otelBatchTimeoutEnv)
		if err != nil {
			log.Error("Value behind WG_OTEL_BATCH_TIMEOUT_MS could not be parsed as integer", zap.Error(err))
		} else {
			otelBatchTimeout = time.Duration(ms) * time.Millisecond
		}
	}

	config.InitConfig(config.Options{
		TelemetryEnabled:     !isTelemetryDisabled,
		TelemetryAnonymousID: telemetryAnonymousID,
	})

	// Can be overwritten by WG_API_URL=<url> env variable
	viper.SetDefault("API_URL", "https://gateway.wundergraph.com")

	rootCmd.PersistentFlags().StringVarP(&rootFlags.CliLogLevel, "cli-log-level", "l", "info", "Sets the CLI log level")
	rootCmd.PersistentFlags().StringVarP(&DotEnvFile, "env", "e", ".env", "Allows you to load environment variables from an env file. Defaults to .env in the current directory.")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.DebugMode, "debug", false, "Enables the debug mode so that all requests and responses will be logged")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.Telemetry, "telemetry", !isTelemetryDisabled, "Enables telemetry. Telemetry allows us to accurately gauge WunderGraph feature usage, pain points, and customization across all users.")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.TelemetryDebugMode, "telemetry-debug", isTelemetryDebugEnabled, "Enables the debug mode for telemetry. Understand what telemetry is being sent to us.")
	rootCmd.PersistentFlags().BoolVar(&rootFlags.PrettyLogs, "pretty-logging", true, "Enables pretty logging")
	rootCmd.PersistentFlags().StringVar(&_wunderGraphDirConfig, "wundergraph-dir", ".", "Directory of your wundergraph.config.ts")
}

// startEmbeddedNats starts the embedded NATS server and returns its URL.
// if the server can't be started, it logs any errors and returns an empty string
func startEmbeddedNats(ctx context.Context, log *zap.Logger) string {
	if os.Getenv(natsDisableEmbeddedServerKey) == "true" {
		return ""
	}

	log.Debug("Embedded NATS server enabled")

	// only for testing, debugging and development purposes
	// in production, the user should run a dedicated NATS server
	wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
	if err != nil {
		log.Warn("could not find WunderGraph directory for NATS", zap.Error(err))
		return ""
	}
	storageDir := filepath.Join(wunderGraphDir, "generated", "nats-server", "storage")
	if err := os.MkdirAll(storageDir, 0755); err != nil {
		log.Warn("could not initialize NATS storage dir", zap.Error(err))
		return ""
	}
	// Select a random TCP port to avoid conflicts with other software
	// starting a NATS server in the default port (e.g. Docker Desktop)
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		log.Error("could not select random port for NATS", zap.Error(err))
		return ""
	}
	randomPort := listener.Addr().(*net.TCPAddr).Port
	listener.Close()
	srv := natsTest.RunServer(&natsServer.Options{
		Port:      randomPort,
		JetStream: true,
		StoreDir:  storageDir,
	})
	if srv == nil {
		log.Warn("Embedded NATS server could not be started")
		return ""
	}
	serverURL := fmt.Sprintf("nats://localhost:%d", randomPort)
	log.Debug("embedded NATS server started", zap.String("url", serverURL))
	go func() {
		<-ctx.Done()
		srv.Shutdown()
		log.Debug("Embedded NATS server stopped")
	}()
	return serverURL
}
