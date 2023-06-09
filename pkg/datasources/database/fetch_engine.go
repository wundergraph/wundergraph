package database

import (
	"compress/gzip"
	"fmt"
	"github.com/prisma/prisma-client-go/binaries"
	"github.com/prisma/prisma-client-go/binaries/platform"
	"io"
	"net/http"
	"os"
	"path"
)

var (
	//PrismaBinaryVersion is taken from the commit sha of https://github.com/prisma/prisma-engines/releases/tag/4.15.0
	PrismaBinaryVersion = "8fbc245156db7124f997f4cecdd8d1219e360944"
)

func copyFile(from string, to string) error {
	input, err := os.ReadFile(from)
	if err != nil {
		return fmt.Errorf("readfile: %w", err)
	}

	if err := os.WriteFile(to, input, os.ModePerm); err != nil {
		return fmt.Errorf("writefile: %w", err)
	}

	return nil
}

func download(url string, to string) error {
	if err := os.MkdirAll(path.Dir(to), os.ModePerm); err != nil {
		return fmt.Errorf("could not run MkdirAll on path %s: %w", to, err)
	}

	// copy to temp file first
	dest := to + ".tmp"

	resp, err := http.Get(url) //nolint:gosec
	if err != nil {
		return fmt.Errorf("could not get %s: %w", url, err)
	}
	//goland:noinspection GoUnhandledErrorResult
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		out, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("received code %d from %s: %+v", resp.StatusCode, url, string(out))
	}

	out, err := os.Create(dest)
	if err != nil {
		return fmt.Errorf("could not create %s: %w", dest, err)
	}
	//goland:noinspection GoUnhandledErrorResult
	defer out.Close()

	if err := os.Chmod(dest, os.ModePerm); err != nil {
		return fmt.Errorf("could not chmod +x %s: %w", url, err)
	}

	g, err := gzip.NewReader(resp.Body)
	if err != nil {
		return fmt.Errorf("could not create gzip reader: %w", err)
	}
	//goland:noinspection GoUnhandledErrorResult
	defer g.Close()

	if _, err := io.Copy(out, g); err != nil { //nolint:gosec
		return fmt.Errorf("could not copy %s: %w", url, err)
	}

	// temp file is ready, now copy to the original destination
	if err := copyFile(dest, to); err != nil {
		return fmt.Errorf("copy temp file: %w", err)
	}

	return nil
}

func FetchEngine(toDir string, engineName string, binaryPlatformName string) error {
	to := platform.CheckForExtension(binaryPlatformName, path.Join(toDir, PrismaBinaryVersion, fmt.Sprintf("prisma-%s-%s", engineName, binaryPlatformName)))

	binaryPlatformRemoteName := binaryPlatformName
	if binaryPlatformRemoteName == "linux" {
		binaryPlatformRemoteName = "linux-musl"
	}
	url := platform.CheckForExtension(binaryPlatformName, fmt.Sprintf(binaries.EngineURL, PrismaBinaryVersion, binaryPlatformRemoteName, engineName))

	if _, err := os.Stat(to); !os.IsNotExist(err) {
		return nil
	}

	if err := download(url, to); err != nil {
		return fmt.Errorf("could not download %s to %s: %w", url, to, err)
	}

	return nil
}
