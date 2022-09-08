package helpers

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jensneuse/abstractlogger"

	"github.com/wundergraph/wundergraph/pkg/node"
)

type NodeShutdownHandler struct {
	quit                     chan os.Signal
	log                      abstractlogger.Logger
	gracefulTimeoutInSeconds int
}

func NewNodeShutdownHandler(log abstractlogger.Logger, gracefulTimeoutInSeconds int) *NodeShutdownHandler {
	quit := make(chan os.Signal, 2)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	return &NodeShutdownHandler{
		log:                      log,
		quit:                     quit,
		gracefulTimeoutInSeconds: gracefulTimeoutInSeconds,
	}
}

func (h *NodeShutdownHandler) HandleGracefulShutdown(ctx context.Context, n *node.Node) {
	select {
	case quitSignal := <-h.quit:
		h.log.Info("Received interrupt quitSignal. Initialize WunderNode shutdown ...",
			abstractlogger.String("quitSignal", quitSignal.String()),
		)
	case <-ctx.Done():
		h.log.Info("Context was canceled. Initialize WunderNode shutdown ....")
	}

	gracefulTimeoutDur := time.Duration(h.gracefulTimeoutInSeconds) * time.Second
	h.log.Info("Graceful shutdown WunderNode ...", abstractlogger.String("gracefulTimeout", gracefulTimeoutDur.String()))
	shutdownCtx, cancel := context.WithTimeout(ctx, gracefulTimeoutDur)
	defer cancel()

	if err := n.Shutdown(shutdownCtx); err != nil {
		h.log.Error("Error during WunderNode shutdown", abstractlogger.Error(err))
	}

	h.log.Info("WunderNode shutdown complete")
}
