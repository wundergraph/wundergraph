package telemetry

import (
	"github.com/wundergraph/wundergraph/pkg/features"
)

const (
	featureNameTag = "WG_TAG_FEATURE_NAME"
)

// NewFeatureMetric creates a data metric which tracks the usage
// of the given featureName
func NewFeatureMetric(featureName features.Feature) *Metric {
	return &Metric{
		Name:  FEATURE_USAGE_METRIC_NAME,
		Value: 1,
		Tags: []MetricTag{
			{Name: featureNameTag, Value: string(featureName)},
		},
	}
}

func FeatureMetrics(wunderGraphDir string) ([]*Metric, error) {
	feats, err := features.EnabledFeatures(wunderGraphDir)
	if err != nil {
		return nil, err
	}
	var metrics []*Metric
	for _, feat := range feats {
		metrics = append(metrics, NewFeatureMetric(feat))
	}
	return metrics, nil
}
