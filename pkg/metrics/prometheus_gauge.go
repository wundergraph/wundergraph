package metrics

import "github.com/prometheus/client_golang/prometheus"

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
