package metrics

import (
	"context"
	"testing"

	"github.com/prometheus/client_golang/prometheus/testutil"
	"github.com/stretchr/testify/assert"
)

var (
	metricOpts = MetricOpts{
		Namespace: "test",
		Subsystem: "test",
		Name:      "test",
	}
)

func metricsOpts(name string) MetricOpts {
	return MetricOpts{
		Namespace: "test",
		Subsystem: "test",
		Name:      name,
	}
}

func TestCounter(t *testing.T) {
	p := NewPrometheus(0)
	defer func() {
		assert.NoError(t, p.Shutdown(context.Background()))
	}()
	counter := p.NewCounterVec(metricsOpts("counter"), "a", "b")
	c := counter.(*prometheusCounterVec)

	counter.Inc("1", "2")
	counter.Add(35, "1", "2")
	assert.Equal(t, float64(36), testutil.ToFloat64(c.counterVec))
}

func TestGauge(t *testing.T) {
	p := NewPrometheus(0)
	defer func() {
		assert.NoError(t, p.Shutdown(context.Background()))
	}()
	gauge := p.NewGaugeVec(metricsOpts("gauge"), "c", "d")
	g := gauge.(*prometheusGaugeVec)

	gauge.Inc("1", "2")
	assert.Equal(t, float64(1), testutil.ToFloat64(g.gaugeVec))

	gauge.Set(0, "1", "2")
	assert.Equal(t, float64(0), testutil.ToFloat64(g.gaugeVec))

	gauge.Add(10, "1", "2")
	assert.Equal(t, float64(10), testutil.ToFloat64(g.gaugeVec))
}

func TestHistogram(t *testing.T) {
	const (
		metricName = "test_test_histogram"
	)
	p := NewPrometheus(0)
	defer func() {
		assert.NoError(t, p.Shutdown(context.Background()))
	}()
	histogram := p.NewHistogramVec(metricsOpts("histogram"), "e", "f")
	h := histogram.(*prometheusHistogramVec)

	assert.Equal(t, 0, testutil.CollectAndCount(h.histogramVec, metricName))

	h.Observe(42, "1", "2")
	assert.Equal(t, 1, testutil.CollectAndCount(h.histogramVec, metricName))
}

func TestSummary(t *testing.T) {
	const (
		metricName = "test_test_summary"
	)
	p := NewPrometheus(0)
	defer func() {
		assert.NoError(t, p.Shutdown(context.Background()))
	}()
	summary := p.NewSummaryVec(metricsOpts("summary"), "e", "f")
	s := summary.(*prometheusSummaryVec)

	assert.Equal(t, 0, testutil.CollectAndCount(s.summaryVec, metricName))

	summary.Observe(42, "1", "2")
	assert.Equal(t, 1, testutil.CollectAndCount(s.summaryVec, metricName))
}
