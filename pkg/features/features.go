// Package features perform feature detection in the current WunderGraph application
package features

import (
<<<<<<< HEAD
	"os"

=======
>>>>>>> origin/main
	"github.com/wundergraph/wundergraph/pkg/config"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Feature string

const (
	OIDC               = Feature("oidc")
	Auth0              = Feature("auth0")
	Prometheus         = Feature("prometheus")
	OpenTelemetry      = Feature("opentelemetry")
	GraphQLEndpoint    = Feature("graphql-endpoint")
	SchemaExtension    = Feature("schema-extension")
	HttpProxy          = Feature("http-proxy")
	MTLS               = Feature("mtls")
	CustomJSONScalars  = Feature("custom-json-scalars")
	CustomIntScalars   = Feature("custom-int-scalars")
	CustomFloatScalars = Feature("custom-float-scalars")
	S3Uploads          = Feature("s3-uploads")
	TokenAuth          = Feature("token-auth")
	ORM                = Feature("orm")
<<<<<<< HEAD
	OpenAI             = Feature("openai")
=======
>>>>>>> origin/main
)

type featureCheck struct {
	Feature Feature
	Check   func(cfg *wgpb.WunderGraphConfiguration) (bool, error)
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

func isFeatureOpenAIEnabled(_ *wgpb.WunderGraphConfiguration) (bool, error) {
	return os.Getenv("OPENAI_API_KEY") != "", nil
}

func featureChecks() []*featureCheck {
	// Same order as Feature declarations
	return []*featureCheck{
		{OIDC, isFeatureOIDCEnabled},
		{Auth0, isFeatureAuth0Enabled},
		{Prometheus, isFeaturePrometheusEnabled},
		{OpenTelemetry, isFeatureOpenTelemetryEnabled},
		{GraphQLEndpoint, isFeatureGraphQLEndpointEnabled},
		{SchemaExtension, isFeatureSchemaExtensionEnabled},
		{HttpProxy, isFeatureHttpProxyEnabled},
		{MTLS, isFeatureMTLSEnabled},
		{CustomJSONScalars, isFeatureCustomJSONScalarsEnabled},
		{CustomIntScalars, isFeatureCustomIntScalarsEnabled},
		{CustomFloatScalars, isFeatureCustomFloatScalarsEnabled},
		{S3Uploads, isFeatureS3UploadsEnabled},
		{TokenAuth, isFeatureTokenAuthEnabled},
		{ORM, isFeatureORMEnabled},
		{OpenAI, isFeatureOpenAIEnabled},
	}
}

// EnabledFeatures returns the features that are enabled in the WunderGraph application
// at the given wunderGraphDir
func EnabledFeatures(wunderGraphDir string) ([]Feature, error) {
	config, err := config.WunderGraphApplicationConfig(wunderGraphDir)
	if err != nil {
		return nil, err
	}
	var features []Feature
	for _, feat := range featureChecks() {
		enabled, err := feat.Check(config)
		if err != nil {
			return nil, err
		}
		if enabled {
			features = append(features, feat.Feature)
		}
	}
	return features, nil
}

// IsEnterprise returns true iff feat is only available with an enterprise license
func IsEnterprise(feat Feature) bool {
	return false
}
