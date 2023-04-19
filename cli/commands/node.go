package commands

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/spf13/cobra"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/telemetry"
	"github.com/wundergraph/wundergraph/pkg/telemetry/otel/trace"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

var nodeCmd = &cobra.Command{
	Use:   "node",
	Short: "Subcommand to work with WunderGraph node",
}

var nodeStartCmd = &cobra.Command{
	Use:   "start",
	Short: "Start runs WunderGraph Node in production mode",
	Long: `
		Example usage:
			wunderctl node start
`,
	Annotations: telemetry.Annotations(telemetry.AnnotationCommand),
	RunE: func(cmd *cobra.Command, args []string) error {
		sigCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		g, ctx := errgroup.WithContext(sigCtx)

		n, err := NewWunderGraphNode(ctx)
		if err != nil {
			log.Error("Could not create node: %w", zap.Error(err))
			return err
		}

		g.Go(func() error {
			return StartWunderGraphNode(n,
				WithIdleHandler(stop),
				WithRequestLogging(rootFlags.DebugMode),
			)
		})

		n.HandleGracefulShutdown(gracefulTimeout)

		// Only exit with error code 1 when the server was not stopped by the signal
		if err := g.Wait(); sigCtx.Err() == nil && err != nil {
			// Exit with error code 1 to indicate failure and restart
			log.Error("WunderGraph node process shutdown: %w", zap.Error(err))
			return err
		}

		// exit code 0 to indicate success
		return nil
	},
}

func init() {
	nodeCmd.AddCommand(nodeStartCmd)
	rootCmd.AddCommand(nodeCmd)

	nodeStartCmd.Flags().IntVar(&shutdownAfterIdle, "shutdown-after-idle", 0, "Shutdown the server after given seconds in idle when no requests have been served")
}

func NewWunderGraphNode(ctx context.Context) (*node.Node, error) {
	wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
	if err != nil {
		return nil, err
	}

	nodeLogger := logging.
		New(rootFlags.PrettyLogs, rootFlags.DebugMode, zapLogLevel)
	return node.New(ctx, BuildInfo, wunderGraphDir, nodeLogger), nil
}

type options struct {
	hooksServerHealthCheck bool
	idleHandler            func()
	enableRequestLogging   bool
}

type Option func(options *options)

func WithHooksServerHealthCheck() Option {
	return func(options *options) {
		options.hooksServerHealthCheck = true
	}
}

func WithIdleHandler(idleHandler func()) Option {
	return func(options *options) {
		options.idleHandler = idleHandler
	}
}

func WithRequestLogging(debugMode bool) Option {
	return func(options *options) {
		options.enableRequestLogging = debugMode
	}
}

func StartWunderGraphNode(n *node.Node, opts ...Option) error {
	var options options
	for i := range opts {
		opts[i](&options)
	}

	configFile := filepath.Join(n.WundergraphDir, "generated", configJsonFilename)
	if !files.FileExists(configFile) {
		return fmt.Errorf("could not find configuration file: %s", configFile)
	}

	data, err := os.ReadFile(configFile)
	if err != nil {
		log.Error("Failed to read file", zap.String("filePath", configFile), zap.Error(err))
		return err
	}

	if len(data) == 0 {
		log.Error("Config file is empty", zap.String("filePath", configFile))
		return errors.New("config file is empty")
	}

	var graphConfig wgpb.WunderGraphConfiguration
	err = json.Unmarshal(data, &graphConfig)
	if err != nil {
		log.Error("Failed to unmarshal", zap.String("filePath", configFile), zap.Error(err))
		return errors.New("failed to unmarshal config file")
	}

	wunderNodeConfig, err := node.CreateConfig(&graphConfig)
	if err != nil {
		log.Error("Failed to create config", zap.String("filePath", configFile), zap.Error(err))
		return err
	}

	nodeOpts := []node.Option{
		node.WithStaticWunderNodeConfig(wunderNodeConfig),
		node.WithForceHttpsRedirects(!disableForceHttpsRedirects),
		node.WithIntrospection(enableIntrospection),
		node.WithTracerProviderInit(func(config node.WunderNodeConfig) (*trace.TracerProvider, error) {
			tracer, err := trace.NewTracerProvider(context.Background(), &trace.TracerProviderConfig{
				Endpoint:       config.Api.Options.OpenTelemetry.ExporterHTTPEndpoint,
				JaegerEndpoint: config.Api.Options.OpenTelemetry.ExporterJaegerEndpoint,
				ServiceName:    "wundergraph-node",
				Enabled:        config.Api.Options.OpenTelemetry.Enabled,
				AuthToken:      config.Api.Options.OpenTelemetry.AuthToken,
			})
			if err != nil {
				return nil, err
			}

			return tracer, nil
		}),
	}

	if shutdownAfterIdle > 0 {
		nodeOpts = append(nodeOpts, node.WithIdleTimeout(time.Duration(shutdownAfterIdle)*time.Second, func() {
			log.Info("shutting down due to idle timeout")
			options.idleHandler()
		}))
	}

	if options.hooksServerHealthCheck {
		nodeOpts = append(nodeOpts, node.WithHooksServerHealthCheck(time.Duration(healthCheckTimeout)*time.Second))
	}

	if options.enableRequestLogging {
		nodeOpts = append(nodeOpts, node.WithRequestLogging(options.enableRequestLogging))
	}

	err = n.StartBlocking(nodeOpts...)
	if err != nil {
		return err
	}

	return nil
}
