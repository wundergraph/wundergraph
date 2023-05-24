package metrics

import (
	"context"
	"errors"
	"net/http"
	"strconv"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type prometheusCounterVec struct {
	counterVec *prometheus.CounterVec
}

func (c *prometheusCounterVec) Inc(labels ...string) {
	c.counterVec.WithLabelValues(labels...).Inc()
}

func (c *prometheusCounterVec) Add(v float64, labels ...string) {
	c.counterVec.WithLabelValues(labels...).Add(v)
}

type prometheusGaugeVec struct {
	gaugeVec *prometheus.GaugeVec
}

func (g *prometheusGaugeVec) Set(v float64, labels ...string) {
	g.gaugeVec.WithLabelValues(labels...).Set(v)
}

func (g *prometheusGaugeVec) Inc(labels ...string) {
	g.gaugeVec.WithLabelValues(labels...).Inc()
}

func (g *prometheusGaugeVec) Add(v float64, labels ...string) {
	g.gaugeVec.WithLabelValues(labels...).Add(v)
}

type prometheusHistogramVec struct {
	histogramVec *prometheus.HistogramVec
}

func (h *prometheusHistogramVec) Observe(v float64, labels ...string) {
	h.histogramVec.WithLabelValues(labels...).Observe(v)
}

type prometheusSummaryVec struct {
	summaryVec *prometheus.SummaryVec
}

func (s *prometheusSummaryVec) Observe(v float64, labels ...string) {
	s.summaryVec.WithLabelValues(labels...).Observe(v)
}

type prometheusMetrics struct {
	server     *http.Server
	registerer prometheus.Registerer
	collectors []prometheus.Collector
}

func (m *prometheusMetrics) NewCounterVec(opts MetricOpts, labelNames ...string) CounterVec {
	counterVec := prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace:   opts.Namespace,
		Subsystem:   opts.Subsystem,
		Name:        opts.Name,
		Help:        opts.Help,
		ConstLabels: prometheus.Labels(opts.ConstLabels),
	}, labelNames)
	if err := m.registerer.Register(counterVec); err != nil {
		var regErr prometheus.AlreadyRegisteredError
		if errors.As(err, &regErr) {
			counterVec = regErr.ExistingCollector.(*prometheus.CounterVec)
		} else {
			panic(err)
		}
	} else {
		m.collectors = append(m.collectors, counterVec)
	}
	return &prometheusCounterVec{
		counterVec: counterVec,
	}
}

func (m *prometheusMetrics) NewGaugeVec(opts MetricOpts, labelNames ...string) GaugeVec {
	gaugeVec := prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace:   opts.Namespace,
		Subsystem:   opts.Subsystem,
		Name:        opts.Name,
		Help:        opts.Help,
		ConstLabels: prometheus.Labels(opts.ConstLabels),
	}, labelNames)
	if err := m.registerer.Register(gaugeVec); err != nil {
		var regErr prometheus.AlreadyRegisteredError
		if errors.As(err, &regErr) {
			gaugeVec = regErr.ExistingCollector.(*prometheus.GaugeVec)
		} else {
			panic(err)
		}
	} else {
		m.collectors = append(m.collectors, gaugeVec)
	}
	return &prometheusGaugeVec{
		gaugeVec: gaugeVec,
	}
}

func (m *prometheusMetrics) NewHistogramVec(opts MetricOpts, labelNames ...string) HistogramVec {
	histogramVec := prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Namespace:   opts.Namespace,
		Subsystem:   opts.Subsystem,
		Name:        opts.Name,
		Help:        opts.Help,
		ConstLabels: prometheus.Labels(opts.ConstLabels),
	}, labelNames)
	if err := m.registerer.Register(histogramVec); err != nil {
		var regErr prometheus.AlreadyRegisteredError
		if errors.As(err, &regErr) {
			histogramVec = regErr.ExistingCollector.(*prometheus.HistogramVec)
		} else {
			panic(err)
		}
	} else {
		m.collectors = append(m.collectors, histogramVec)
	}
	return &prometheusHistogramVec{
		histogramVec: histogramVec,
	}
}

func (m *prometheusMetrics) NewSummaryVec(opts MetricOpts, labelNames ...string) SummaryVec {
	summaryVec := prometheus.NewSummaryVec(prometheus.SummaryOpts{
		Namespace:   opts.Namespace,
		Subsystem:   opts.Subsystem,
		Name:        opts.Name,
		Help:        opts.Help,
		ConstLabels: prometheus.Labels(opts.ConstLabels),
	}, labelNames)

	if err := m.registerer.Register(summaryVec); err != nil {
		var regErr prometheus.AlreadyRegisteredError
		if errors.As(err, &regErr) {
			summaryVec = regErr.ExistingCollector.(*prometheus.SummaryVec)
		} else {
			panic(err)
		}
	} else {
		m.collectors = append(m.collectors, summaryVec)
	}
	return &prometheusSummaryVec{
		summaryVec: summaryVec,
	}
}

func (m *prometheusMetrics) Serve() error {
	err := m.server.ListenAndServe()
	if err == http.ErrServerClosed {
		err = ErrServerClosed
	}
	return err
}

func (m *prometheusMetrics) Shutdown(ctx context.Context) error {
	if err := m.server.Shutdown(ctx); err != nil {
		return err
	}
	for _, collector := range m.collectors {
		m.registerer.Unregister(collector)
	}
	return nil
}

// NewPrometheus returns a metrics provider that exposes the metrics via Prometheus
// on the given port, at /metrics
func NewPrometheus(httpPort int) Metrics {
	addr := ":" + strconv.Itoa(httpPort)
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.Handler())
	server := &http.Server{
		Addr:    addr,
		Handler: mux,
	}
	return &prometheusMetrics{
		server:     server,
		registerer: prometheus.DefaultRegisterer,
	}
}
