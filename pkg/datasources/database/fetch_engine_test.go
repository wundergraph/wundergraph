package database

import (
	"github.com/prisma/prisma-client-go/binaries/platform"
	"os"
	"testing"
)

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

	var engines = []string{"query-engine", "migration-engine"}

	for _, engine := range engines {
		if err := FetchEngine(dir, engine, platform.BinaryPlatformName()); err != nil {
			t.Fatalf("FetchEngine failed for %s: %s", engine, err)
		}
	}
}
