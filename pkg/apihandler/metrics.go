package apihandler

import (
	"bufio"
	"errors"
	"io"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/wundergraph/wundergraph/pkg/metrics"
)

const (
	metricsNamespace = "wundernode"
)

var (
	_ http.ResponseWriter = (*responseWriter)(nil)
	_ http.Flusher        = (*responseWriter)(nil)
	_ http.CloseNotifier  = (*responseWriter)(nil)
	_ http.Hijacker       = (*responseWriter)(nil)
	_ io.ReaderFrom       = (*responseWriter)(nil)
)

type responseWriter struct {
	statusCode int
	written    int64
	w          http.ResponseWriter
}

func (w *responseWriter) Header() http.Header {
	return w.w.Header()
}

func (w *responseWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode
	w.w.WriteHeader(statusCode)
}

func (w *responseWriter) Write(data []byte) (int, error) {
	if w.statusCode == 0 {
		w.WriteHeader(http.StatusOK)
	}
	n, err := w.w.Write(data)
	w.written += int64(n)
	return n, err
}

func (w *responseWriter) Flush() {
	if f, ok := w.w.(http.Flusher); ok {
		f.Flush()
	}
}

func (w *responseWriter) CloseNotify() <-chan bool {
	if cn, ok := w.w.(http.CloseNotifier); ok {
		return cn.CloseNotify()
	}
	return nil
}

func (w *responseWriter) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if h, ok := w.w.(http.Hijacker); ok {
		return h.Hijack()
	}
	return nil, nil, errors.New("underlying http.ResponseWriter is not an http.Hijacker")
}

func (w *responseWriter) ReadFrom(r io.Reader) (int64, error) {
	if w.statusCode == 0 {
		w.WriteHeader(http.StatusOK)
	}
	var n int64
	var err error
	if rf, ok := w.w.(io.ReaderFrom); ok {
		n, err = rf.ReadFrom(r)
	} else {
		n, err = io.Copy(w.w, r)

	}
	w.written += n
	return n, err
}

// operationMetrics represents an interface type that provides handlers
// for collecting operation metrics
type operationMetrics interface {
	// Handler wraps the given http.Handler returning a new http.Handler which
	// counts requests to the given operation
	Handler(operationHandler http.Handler) http.Handler
}

type operationMetricsHandler struct {
	counter         metrics.CounterVec
	requestDuration metrics.SummaryVec
	requestSize     metrics.SummaryVec
	responseSize    metrics.SummaryVec
}

func (h *operationMetricsHandler) inc(statusCode int) {
	h.counter.Inc(strconv.Itoa(statusCode))
}

func (h *operationMetricsHandler) estimateRequestSize(r *http.Request) int {
	s := len(r.Method) + len(r.Proto)
	for name, values := range r.Header {
		s += len(name)
		for _, value := range values {
			s += len(value)
		}
	}
	s += len(r.Host)

	if r.ContentLength != -1 {
		s += int(r.ContentLength)
	}
	return s
}

func (h *operationMetricsHandler) Handler(operationHandler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := &responseWriter{
			w: w,
		}
		operationHandler.ServeHTTP(ww, r)
		elapsed := time.Since(start)

		// XXX: Must match the number of dynamic labels used at creation
		h.counter.Inc(strconv.Itoa(ww.statusCode))
		h.requestDuration.Observe(elapsed.Seconds())
		h.requestSize.Observe(float64(h.estimateRequestSize(r)))
		h.responseSize.Observe(float64(ww.written))
	})
}

// newOperationMetrics returns a new operationMetrics which can count requests.
func newOperationMetrics(m metrics.Metrics, operationName string) operationMetrics {
	// XXX: Dynamic label counts must match between here and their uses in Handler()
	constLabels := metrics.Labels{
		"operationName": operationName,
	}
	counter := m.NewCounterVec(metrics.MetricOpts{
		Namespace:   metricsNamespace,
		Name:        "http_requests_total",
		Help:        "Total number of served HTTP requests",
		ConstLabels: constLabels,
	}, "statusCode")

	requestDuration := m.NewSummaryVec(metrics.MetricOpts{
		Namespace:   metricsNamespace,
		Name:        "http_request_duration_seconds",
		Help:        "Duration of HTTP requests",
		ConstLabels: constLabels,
	})

	requestSize := m.NewSummaryVec(metrics.MetricOpts{
		Namespace:   metricsNamespace,
		Name:        "http_response_size_bytes",
		Help:        "Size of served HTTP responses",
		ConstLabels: constLabels,
	})

	responseSize := m.NewSummaryVec(metrics.MetricOpts{
		Namespace:   metricsNamespace,
		Name:        "http_request_size_bytes",
		Help:        "Size of received HTTP requests",
		ConstLabels: constLabels,
	})

	return &operationMetricsHandler{
		counter:         counter,
		requestDuration: requestDuration,
		requestSize:     requestSize,
		responseSize:    responseSize,
	}
}

type outgoingRequestCounter struct {
	requestsCounter metrics.CounterVec
	requestDuration metrics.SummaryVec
}

func newOutgoingRequestCounter(m metrics.Metrics) *outgoingRequestCounter {
	const (
		subsystem = "api_transport"
	)

	requestCounter := m.NewCounterVec(metrics.MetricOpts{
		Namespace: metricsNamespace,
		Subsystem: subsystem,
		Name:      "outgoing_http_requests_total",
		Help:      "Outgoing HTTP requests sent to upstream APIs",
	}, "host", "method", "statusCode")

	requestDuration := m.NewSummaryVec(metrics.MetricOpts{
		Namespace: metricsNamespace,
		Subsystem: subsystem,
		Name:      "outgoing_http_request_duration",
		Help:      "Duration of outgoing HTTP requests sent to upstream APIs",
	}, "host", "method", "statusCode")

	return &outgoingRequestCounter{
		requestsCounter: requestCounter,
		requestDuration: requestDuration,
	}
}

func (c *outgoingRequestCounter) Inc(r *http.Request, resp *http.Response, duration time.Duration) {
	host := r.Host
	if host == "" {
		host = r.URL.Host
	}
	method := strings.ToUpper(r.Method)
	statusCode := strconv.Itoa(resp.StatusCode)
	c.requestsCounter.Inc(host, method, statusCode)
	c.requestDuration.Observe(duration.Seconds(), host, method, statusCode)
}
