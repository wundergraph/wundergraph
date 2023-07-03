package telemetry

import (
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Feature string

const (
	FeatureOIDC               = Feature("oidc")
	FeatureAuth0              = Feature("auth0")
	FeaturePrometheus         = Feature("prometheus")
	FeatureOpenTelemetry      = Feature("opentelemetry")
	FeatureGraphQLEndpoint    = Feature("graphql-endpoint")
	FeatureSchemaExtension    = Feature("schema-extension")
	FeatureHttpProxy          = Feature("http-proxy")
	FeatureMTLS               = Feature("mtls")
	FeatureCustomJSONScalars  = Feature("custom-json-scalars")
	FeatureCustomIntScalars   = Feature("custom-int-scalars")
	FeatureCustomFloatScalars = Feature("custom-float-scalars")
	FeatureS3Uploads          = Feature("s3-uploads")
	FeatureTokenAuth          = Feature("token-auth")
	FeatureORM                = Feature("orm")
)

const (
	featureNameTag = "WG_TAG_FEATURE_NAME"
)

type featureCheck struct {
	Name  Feature
	Check func(cfg *wgpb.WunderGraphConfiguration) (bool, error)
}

func isFeatureOIDCEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	providers := cfg.GetApi().GetAuthenticationConfig().GetCookieBased().GetProviders()
	for _, p := range providers {
		if p.Kind == wgpb.AuthProviderKind_AuthProviderAuth0 {
			return true, nil
		}
	}
	return false, nil
}

func isFeatureAuth0Enabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	providers := cfg.GetApi().GetAuthenticationConfig().GetCookieBased().GetProviders()
	for _, p := range providers {
		if p.Kind == wgpb.AuthProviderKind_AuthProviderOIDC {
			return true, nil
		}
	}
	return false, nil
}

func isFeaturePrometheusEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return loadvariable.Bool(cfg.GetApi().GetNodeOptions().GetPrometheus().GetEnabled())
}

func isFeatureOpenTelemetryEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return loadvariable.Bool(cfg.GetApi().GetNodeOptions().GetOpenTelemetry().GetEnabled())
}

func isFeatureGraphQLEndpointEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return cfg.GetApi().GetEnableGraphqlEndpoint(), nil
}

func isFeatureSchemaExtensionEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return cfg.GetEnabledFeatures().GetSchemaExtension(), nil
}

func isFeatureHttpProxyEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	defaultHttpProxy := loadvariable.String(cfg.GetApi().GetNodeOptions().GetDefaultHttpProxyUrl())
	if defaultHttpProxy != "" {
		return true, nil
	}
	for _, ds := range cfg.GetApi().GetEngineConfiguration().GetDatasourceConfigurations() {
		if proxy := loadvariable.String(ds.GetCustomRest().GetFetch().GetHttpProxyUrl()); proxy != "" {
			return true, nil
		}
		if proxy := loadvariable.String(ds.GetCustomGraphql().GetFetch().GetHttpProxyUrl()); proxy != "" {
			return true, nil
		}
	}
	return false, nil
}

func isFeatureMTLSEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	for _, ds := range cfg.GetApi().GetEngineConfiguration().GetDatasourceConfigurations() {
		if ds.GetCustomRest().GetFetch().GetMTLS() != nil {
			return true, nil
		}
		if ds.GetCustomGraphql().GetFetch().GetMTLS() != nil {
			return true, nil
		}
	}
	return false, nil
}

func isFeatureCustomJSONScalarsEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return cfg.GetEnabledFeatures().GetCustomJSONScalars(), nil
}

func isFeatureCustomIntScalarsEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return cfg.GetEnabledFeatures().GetCustomIntScalars(), nil
}

func isFeatureCustomFloatScalarsEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return cfg.GetEnabledFeatures().GetCustomFloatScalars(), nil
}

func isFeatureS3UploadsEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return len(cfg.GetApi().GetS3UploadConfiguration()) > 0, nil
}

func isFeatureTokenAuthEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return cfg.GetApi().GetAuthenticationConfig().GetJwksBased() != nil, nil
}

func isFeatureORMEnabled(cfg *wgpb.WunderGraphConfiguration) (bool, error) {
	return cfg.GetApi().GetExperimentalConfig().GetOrm(), nil
}

func featureChecks() []*featureCheck {
	// Same order as Feature declarations
	return []*featureCheck{
		{FeatureOIDC, isFeatureOIDCEnabled},
		{FeatureAuth0, isFeatureAuth0Enabled},
		{FeaturePrometheus, isFeaturePrometheusEnabled},
		{FeatureOpenTelemetry, isFeatureOpenTelemetryEnabled},
		{FeatureGraphQLEndpoint, isFeatureGraphQLEndpointEnabled},
		{FeatureSchemaExtension, isFeatureSchemaExtensionEnabled},
		{FeatureHttpProxy, isFeatureHttpProxyEnabled},
		{FeatureMTLS, isFeatureMTLSEnabled},
		{FeatureCustomJSONScalars, isFeatureCustomJSONScalarsEnabled},
		{FeatureCustomIntScalars, isFeatureCustomIntScalarsEnabled},
		{FeatureCustomFloatScalars, isFeatureCustomFloatScalarsEnabled},
		{FeatureS3Uploads, isFeatureS3UploadsEnabled},
		{FeatureTokenAuth, isFeatureTokenAuthEnabled},
		{FeatureORM, isFeatureORMEnabled},
	}
}

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
	for _, feat := range featureChecks() {
		enabled, err := feat.Check(config)
		if err != nil {
			return nil, err
		}
		if enabled {
			metrics = append(metrics, NewFeatureMetric(feat.Name))
		}
	}
	return metrics, nil
}
