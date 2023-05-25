package trace

import (
	"go.uber.org/zap"
	"testing"
)

func TestStartAgent(t *testing.T) {

	const (
		endpoint = "localhost:1234"
	)
	c1 := Config{
		Name: "foo",
	}
	c2 := Config{
		Name:     "bla",
		Endpoint: endpoint,
		Batcher:  "otlp",
	}
	c3 := Config{
		Name:     "otlphttp",
		Endpoint: endpoint,
		Batcher:  kindOtlpHttp,
		OtlpHeaders: map[string]string{
			"Authorization": "Bearer token",
		},
		OtlpHttpPath: "/v1/traces",
	}

	log := zap.NewNop()

	StartAgent(log, c1)
	StartAgent(log, c2)
	StartAgent(log, c3)
}
