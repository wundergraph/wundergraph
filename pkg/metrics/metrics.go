// Package metrics implements support for exposing metrics using different providers
//
// To create a new Metrics, use either NewPrometheus() or NewNone(). From there, call
// the New*() functions to obtain a metric and use them.
package metrics

import (
	"context"
	"net/http"
)

var (
	// ErrServerClosed is the error returned by Serve when the Metrics
	// server is closed.
	ErrServerClosed = http.ErrServerClosed
)

type Labels map[string]string

// MetricOpts represents the options used by all types of metrics.
// See https://prometheus.io/docs/practices/naming/ for choosing
// a metric name.
type MetricOpts struct {
	Namespace   string
	Subsystem   string
	Name        string
	Help        string
	ConstLabels Labels
}

// CounterVec implements a Counter which can only increase in value.
// Notice that the amount of label values must match the number of
// label names used when creating the CounterVec.
type CounterVec interface {
	Inc(labelValues ...string)
	Add(v float64, labelValues ...string)
}

// GaugeVec implements a Gauge that might increase or decrease in value
// over time.
// Notice that the amount of label values must match the number of
// label names used when creating the GaugeVec.
type GaugeVec interface {
	Set(v float64, labelValues ...string)
	Inc(labelValues ...string)
	Add(v float64, labelValues ...string)
}

// A HistogramVec interface represents a histogram vector.
// Notice that the amount of label values must match the number of
// label names used when creating the HistogramVec.
type HistogramVec interface {
	Observe(v float64, labelValues ...string)
}

type SummaryVec interface {
	Observe(v float64, labelValues ...string)
}

// Metrics is an interface which wraps a metrics generator. To create a Metrics
// use one of the New*() functions in this package. After that, create any metrics
// you need using the New*() functions in this interface. To serve the metrics call
// Serve() at some point. Finally, call Shutdown() to exit cleanly.
type Metrics interface {
	// NewCounterVec returns a CounterVec with the given options and labels.
	// See CounterVec for more information.
	NewCounterVec(opts MetricOpts, labelNames ...string) CounterVec
	// NewGaugeVec returns a GaugeVec with the given options and labels.
	// See GaugeVec for more information.
	NewGaugeVec(opts MetricOpts, labelNames ...string) GaugeVec
	// NewHistogramVec returns a HistogramVec with the given options and labels.
	// See HistogramVec for more information.
	NewHistogramVec(opts MetricOpts, labelNames ...string) HistogramVec
	// NewSummaryVec returns a HistogramVec with the given options and labels.
	// See SummaryVec for more information.
	NewSummaryVec(opts MetricOpts, labelNames ...string) SummaryVec
	// Serve starts serving the metrics collected by this Metrics, in a blocking way.
	// After shutdown, it will return ErrShutdown.
	Serve() error
	// Shutdown stops serving the metrics
	Shutdown(ctx context.Context) error
}
