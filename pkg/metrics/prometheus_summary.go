package metrics

import "github.com/prometheus/client_golang/prometheus"

type prometheusSummaryVec struct {
	summaryVec *prometheus.SummaryVec
}

func (s *prometheusSummaryVec) Observe(v float64, labels ...string) {
	s.summaryVec.WithLabelValues(labels...).Observe(v)
}
