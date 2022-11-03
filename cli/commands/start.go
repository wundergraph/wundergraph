package commands

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
	"golang.org/x/sync/errgroup"
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
	Use:   "start",
	Short: "Starts WunderGraph in production mode",
	Long:  `Start runs WunderGraph Node and Server as a single process in production mode`,
	Run: func(cmd *cobra.Command, args []string) {
		sigCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		g, ctx := errgroup.WithContext(sigCtx)

		n, err := NewWunderGraphNode(ctx)
		if err != nil {
			log.Fatal("Could not create node: %w", abstractlogger.Error(err))
		}

		if !excludeServer {
			g.Go(func() error {
				return startWunderGraphServer(ctx)
			})
		}

		g.Go(func() error {
			return StartWunderGraphNode(n, WithIdleHandler(stop), WithHooksServerHealthCheck())
		})

		n.HandleGracefulShutdown(gracefulTimeout)

		// Only exit with error code 1 when the server was not stopped by the signal
		if err := g.Wait(); sigCtx.Err() == nil && err != nil {
			// Exit with error code 1 to indicate failure and restart
			log.Fatal("WunderGraph process shutdown: %w", abstractlogger.Error(err))
		}

		// exit code 0 to indicate success
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().IntVar(&gracefulTimeout, "graceful-timeout", defaultNodeGracefulTimeoutSeconds, "graceful-timeout is the time in seconds the server has to graceful shutdown")
	startCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "starts the engine without the server")
	startCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "enables GraphQL introspection on /%api%/%main%/graphql")
	startCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "disables authentication to enforce https redirects")
	startCmd.Flags().IntVar(&shutdownAfterIdle, "shutdown-after-idle", 0, "shuts down the server after given seconds in idle when no requests have been served")
	startCmd.Flags().IntVar(&healthCheckTimeout, "healthcheck-timeout", 10, "healthcheck timeout in seconds")
}
