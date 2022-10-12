package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/spf13/cobra"
	"golang.org/x/sync/errgroup"

	"github.com/wundergraph/wundergraph/pkg/httpidletimeout"
	"github.com/wundergraph/wundergraph/pkg/node"
)

var (
	excludeServer              bool
	disableForceHttpsRedirects bool
	enableIntrospection        bool
	gracefulTimeout            int
	exitAfterIdle              int
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Starts WunderGraph in production mode",
	Long:  `Start runs WunderGraph Node and Server as a single process in production mode`,
	RunE: func(cmd *cobra.Command, args []string) error {
		sigCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		g, ctx := errgroup.WithContext(sigCtx)

		n, err := NewWunderGraphNode(ctx)
		if err != nil {
			return err
		}

		var opts []node.Option
		if exitAfterIdle > 0 {
			middleware := httpidletimeout.New(time.Duration(exitAfterIdle) * time.Second)
			defer middleware.Cancel()
			opts = append(opts, node.WithMiddleware(middleware.Handler))
			go func() {
				<-middleware.C()
				log.Info("exiting due to idle timeout")
				stop()
			}()
		}

		if !excludeServer {
			g.Go(func() error {
				err := startWunderGraphServer(ctx)
				if err != nil {
					log.Error("Start server", abstractlogger.Error(err))
				}
				return err
			})
		}

		g.Go(func() error {
			err := StartWunderGraphNode(n, opts...)
			if err != nil {
				log.Error("Start node", abstractlogger.Error(err))
			}
			return err
		})

		n.HandleGracefulShutdown(gracefulTimeout)

		if err := g.Wait(); err != nil {
			return fmt.Errorf("WunderGraph process shutdown: %w", err)
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(startCmd)
	startCmd.Flags().IntVar(&gracefulTimeout, "graceful-timeout", defaultNodeGracefulTimeoutSeconds, "graceful-timeout is the time in seconds the server has to graceful shutdown")
	startCmd.Flags().BoolVar(&excludeServer, "exclude-server", false, "starts the engine without the server")
	startCmd.Flags().BoolVar(&enableIntrospection, "enable-introspection", false, "enables GraphQL introspection on /%api%/%main%/graphql")
	startCmd.Flags().BoolVar(&disableForceHttpsRedirects, "disable-force-https-redirects", false, "disables authentication to enforce https redirects")
	startCmd.Flags().IntVar(&exitAfterIdle, "exit-after-idle", 0, "exits after the given timeout has elapsed without any requests, in seconds")
}
