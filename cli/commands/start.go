package commands

import (
	"context"
	"github.com/jensneuse/abstractlogger"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"
	"golang.org/x/sync/errgroup"
)

var (
	excludeServer              bool
	disableForceHttpsRedirects bool
	enableIntrospection        bool
	gracefulTimeout            int
)

// startCmd represents the start command
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Starts WunderGraph in production mode",
	Long:  `Start runs WunderGraph Node and Server as a single process in production mode`,
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer stop()

		n, err := NewWunderGraphNode(ctx)
		if err != nil {
			return err
		}

		g, ctx := errgroup.WithContext(ctx)

		if !excludeServer {
			g.Go(func() error {
				err := startWunderGraphServer(ctx)
				if err != nil {
					log.Error("start server", abstractlogger.Error(err))
				}
				return err
			})
		}

		g.Go(func() error {
			err := StartWunderGraphNode(n)
			if err != nil {
				log.Error("start node", abstractlogger.Error(err))
			}
			return err
		})

		<-ctx.Done()

		n.HandleGracefulShutdown(gracefulTimeout)

		if ctx.Err() != context.Canceled {
			return err
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
}
