package commands

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"
	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"

	"github.com/wundergraph/wundergraph/pkg/telemetry"
)

var (
	excludeServer              bool
	disableForceHttpsRedirects bool
	enableIntrospection        bool
	gracefulTimeout            int
	shutdownAfterIdle          int
	healthCheckTimeout         int
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:         "start",
	Short:       "Starts WunderGraph in production mode",
	Long:        `Start runs WunderGraph Node and Server as a single process in production mode`,
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

		if !excludeServer {
			g.Go(func() error {
				return startHooksServer(ctx)
			})
		}

		g.Go(func() error {
			log.Info("Starting WunderNode",
				zap.String("version", BuildInfo.Version),
				zap.String("commit", BuildInfo.Commit),
				zap.String("date", BuildInfo.Date),
				zap.String("builtBy", BuildInfo.BuiltBy),
			)

			return StartWunderGraphNode(n,
				WithIdleHandler(stop),
				WithHooksServerHealthCheck(),
				WithRequestLogging(rootFlags.DebugMode),
			)
		})

		n.HandleGracefulShutdown(gracefulTimeout)

		// Only exit with error code 1 when the server was not stopped by the signal
		if err := g.Wait(); sigCtx.Err() == nil && err != nil {
			// Exit with error code 1 to indicate failure and restart
			log.Error("WunderGraph start process shutdown", zap.Error(err))
			return err
		}

		// exit code 0 to indicate success
		return nil
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().IntVar(&gracefulTimeout, "graceful-timeout", defaultNodeGracefulTimeoutSeconds, "Graceful-timeout is the time in seconds the server has to graceful shutdown")
	startCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "Starts the engine without the server")
	startCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "Enables GraphQL introspection on /%api%/%main%/graphql")
	startCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "Disables authentication to enforce https redirects")
	startCmd.Flags().IntVar(&shutdownAfterIdle, "shutdown-after-idle", 0, "Shutdown the server after given seconds in idle when no requests have been served")
	startCmd.Flags().IntVar(&healthCheckTimeout, "healthcheck-timeout", 10, "Healthcheck timeout in seconds")
}
