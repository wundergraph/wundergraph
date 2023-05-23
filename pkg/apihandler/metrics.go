package apihandler

import (
	"net/http"

	"github.com/wundergraph/wundergraph/pkg/metrics"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

// OperationMetrics represents an interface type that provides handlers
// for collecting operation metrics
type OperationMetrics interface {
	// Handler wraps the given http.Handler returning a new http.Handler which
	// counts requests to the given operation
	Handler(operation *wgpb.Operation, operationHandler http.Handler) http.Handler
}

type operationMetrics struct {
	counter metrics.CounterVec
}

func (m *operationMetrics) inc(operation *wgpb.Operation) {
	// XXX: These need to be as many as passed to NewCounterVec()
	m.counter.Inc(operation.Name, operation.OperationType.String())
}

func (m *operationMetrics) Handler(operation *wgpb.Operation, operationHandler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		m.inc(operation)
		operationHandler.ServeHTTP(w, r)
	})
}

// NewRequestMetrics returns a new RequestMetrics which can count requests.
// XXX: Do NOT create more than one of these because the metric names will conflict.
func NewOperationMetrics(m metrics.Metrics) OperationMetrics {
	return &operationMetrics{
		counter: m.NewCounterVec(metrics.MetricOpts{
			Namespace: "wunderctl",
			Subsystem: "http_requests",
			Name:      "total",
			Help:      "Total number of HTTP requests",
		}, "operationName", "operationType"), // XXX: Same number of labels as used in inc
	}
}
