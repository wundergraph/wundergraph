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
	// OtlpHeaders represents the headers for OTLP gRPC or HTTP transport.
	// For example:
	//  uptrace-dsn: 'http://project2_secret_token@localhost:14317/2'
	OtlpHeaders map[string]string
	// OtlpHttpPath represents the path for OTLP HTTP transport.
	// For example
	// /v1/traces
	OtlpHttpPath string
}
