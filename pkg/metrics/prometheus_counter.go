package metrics

import "github.com/prometheus/client_golang/prometheus"

type prometheusCounterVec struct {
	counterVec *prometheus.CounterVec
}

func (c *prometheusCounterVec) Inc(labels ...string) {
	c.counterVec.WithLabelValues(labels...).Inc()
}

func (c *prometheusCounterVec) Add(v float64, labels ...string) {
	c.counterVec.WithLabelValues(labels...).Add(v)
}
