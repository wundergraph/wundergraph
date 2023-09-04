package database

import (
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

var platforms = []string{
	"darwin",
	"linux",
	"windows",
	"linux-musl-arm64-openssl-3.0.x",
}

func tmpDir(t *testing.T) string {
	dir, err := os.MkdirTemp("/tmp", "prisma-client-go-test-fetchEngine-")
	if err != nil {
		t.Fatal(err)
	}
	return dir
}

func TestFetchEngine(t *testing.T) {
	dir := tmpDir(t)
	//goland:noinspection GoUnhandledErrorResult
	defer os.RemoveAll(dir)

	engine := NewEngine(&http.Client{
		Timeout: time.Second * 5,
	}, zap.NewNop(), dir)

	var engines = []string{"query-engine", "migration-engine"}

	for _, engineName := range engines {
		platformName, err := engine.BinaryPlatformName()
		assert.NoError(t, err)
		if err := engine.FetchEngine(dir, engineName, platformName); err != nil {
			t.Fatalf("FetchEngine failed for %s: %s", engineName, err)
		}
	}
}

func TestEngineAvailability(t *testing.T) {
	dir := tmpDir(t)
	//goland:noinspection GoUnhandledErrorResult
	defer os.RemoveAll(dir)

	engine := NewEngine(&http.Client{
		Timeout: time.Second * 5,
	}, zap.NewNop(), dir)

	var engines = []string{"query-engine", "migration-engine"}

	for _, engineName := range engines {
		for _, platform := range platforms {
			platform := platform
			url := engine.GetEngineURL(engineName, platform)
			t.Run(engineName+"_"+platform, func(t *testing.T) {
				t.Parallel()
				t.Logf("testing URL %s", url)
				resp, err := http.Head(url)
				if err != nil || resp.StatusCode != 200 {
					t.Fatalf("Engine %s unavailable for platform %s", engineName, platform)
				}
				resp.Body.Close()
			})
		}
	}
}
