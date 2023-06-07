package trace

import "time"

// TraceName represents the tracing name.
const TraceName = "wundergraph"

// A Config is an opentelemetry config.
type Config struct {
	Name         string
	Endpoint     string
	Sampler      float64
	Batcher      string
	BatchTimeout time.Duration
	// OtlpHeaders represents the headers for HTTP transport.
	// For example:
	//  Authorization: 'Bearer <token>'
	OtlpHeaders map[string]string
	// OtlpHttpPath represents the path for OTLP HTTP transport.
	// For example
	// /v1/traces
	OtlpHttpPath string
}
