package telemetry

import (
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Feature string

const (
	FeatureOIDC          = Feature("oidc")
	FeaturePrometheus    = Feature("prometheus")
	FeatureOpenTelemetry = Feature("opentelemetry")
)

const (
	featureNameTag = "WG_TAG_FEATURE_NAME"
)

// NewFeatureMetric creates a data metric which tracks the usage
// of the given featureName
func NewFeatureMetric(featureName Feature) *Metric {
	return &Metric{
		Name:  FEATURE_USAGE_METRIC_NAME,
		Value: 1,
		Tags: []MetricTag{
			{Name: featureNameTag, Value: string(featureName)},
		},
	}
}

func FeatureMetrics(wunderGraphDir string) ([]*Metric, error) {
	config, err := readWunderGraphConfig(wunderGraphDir)
	if err != nil {
		return nil, err
	}
	var metrics []*Metric
	providers := config.Api.GetAuthenticationConfig().GetCookieBased().GetProviders()
	for _, p := range providers {
		if p.Kind == wgpb.AuthProviderKind_AuthProviderAuth0 || p.Kind == wgpb.AuthProviderKind_AuthProviderOIDC {
			metrics = append(metrics, NewFeatureMetric(FeatureOIDC))
			break
		}
	}
	usePrometheus, err := loadvariable.Bool(config.Api.GetNodeOptions().GetPrometheus().GetEnabled())
	if err != nil {
		return nil, err
	}
	if usePrometheus {
		metrics = append(metrics, NewFeatureMetric(FeaturePrometheus))
	}
	useOpenTelemetry, err := loadvariable.Bool(config.Api.GetNodeOptions().GetOpenTelemetry().GetEnabled())
	if useOpenTelemetry {
		metrics = append(metrics, NewFeatureMetric(FeatureOpenTelemetry))
	}
	return metrics, nil
}
