package commands

import (
	"context"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/spf13/cobra"
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

		var (
			errChan    = make(chan error)
			doneChan   = make(chan struct{})
			shutdownWg sync.WaitGroup
		)

		if !excludeServer {
			shutdownWg.Add(1)
			go func() {
				defer shutdownWg.Done()

				if err := startWunderGraphServer(ctx); err != nil {
					errChan <- err
				}
			}()
		}

		shutdownWg.Add(1)
		go func() {
			defer shutdownWg.Done()

			if err := startWunderGraphNode(ctx, gracefulTimeout); err != nil {
				errChan <- err
			}
		}()

		go func() {
			shutdownWg.Wait()
			close(doneChan)
		}()

		select {
		case <-doneChan:
		case err := <-errChan:
			stop()
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
