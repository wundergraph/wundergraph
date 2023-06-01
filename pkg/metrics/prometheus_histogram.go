package metrics

import "github.com/prometheus/client_golang/prometheus"

type prometheusHistogramVec struct {
	histogramVec *prometheus.HistogramVec
}

func (h *prometheusHistogramVec) Observe(v float64, labels ...string) {
	h.histogramVec.WithLabelValues(labels...).Observe(v)
}
