package metrics

import "context"

type noMetric struct{}

func (m noMetric) Inc(labelValues ...string)                {}
func (m noMetric) Add(v float64, labelValues ...string)     {}
func (m noMetric) Set(v float64, labelValues ...string)     {}
func (m noMetric) Observe(v float64, labelValues ...string) {}

type noMetrics struct{}

func (n noMetrics) NewCounterVec(opts MetricOpts, labelNames ...string) CounterVec { return noMetric{} }
func (n noMetrics) NewGaugeVec(opts MetricOpts, labelNames ...string) GaugeVec     { return noMetric{} }
func (n noMetrics) NewHistogramVec(opts MetricOpts, labelNames ...string) HistogramVec {
	return noMetric{}
}
func (n noMetrics) NewSummaryVec(opts MetricOpts, labelNames ...string) SummaryVec { return noMetric{} }
func (n noMetrics) Serve() error                                                   { return nil }
func (n noMetrics) Shutdown(ctx context.Context) error                             { return nil }

// NewNone returns a metrics provider that does nothing
func NewNone() Metrics {
	return noMetrics{}
}
