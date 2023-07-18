package database

import (
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"go.uber.org/zap"
)

var (
	//PrismaBinaryVersion is taken from the commit sha of https://github.com/prisma/prisma-engines/releases/tag/4.15.0
	PrismaBinaryVersion = "8fbc245156db7124f997f4cecdd8d1219e360944"
	EngineURL           = "https://binaries.prisma.sh/all_commits/%s/%s/%s.gz"
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

var binaryNameWithSSLCache string

// parseOpenSSLVersion returns the OpenSSL version, ignoring the patch version; e.g. 1.1.x
func parseOpenSSLVersion(str string) string {
	r := regexp.MustCompile(`^(Open|Libre)SSL\s(\d+\.\d+)\.\d+`)
	matches := r.FindStringSubmatch(str)
	if len(matches) > 0 {
		majorMinor := matches[1]
		if majorMinor == "3.1" {
			// Prisma provides no binaries for 3.1, use 3.0
			majorMinor = "3.0"
		}
		return majorMinor + ".x"
	}
	// default to 1.1.x
	return "1.1.x"
}

// getOpenSSLByTestingLib tries to determine the OpenSSL version by
// checking for shared library files in the filesystem. If no libraries
// can be found it returns an empty string (Note: this only succeeds on
// Linux)
func getOpenSSLByTestingLib() string {
	sslSuffixes := map[string]string{
		"3": "3.0.x",
		"1": "1.1.x",
	}
	libPaths := []string{"/lib", "/usr/lib"}
	for _, p := range libPaths {
		for suffix, version := range sslSuffixes {
			ssl := filepath.Join(p, fmt.Sprintf("libssl.so.%s", suffix))
			if _, err := os.Stat(ssl); err == nil {
				return version
			}
		}
	}
	return ""
}

// getOpenSSL tries to determine the openssl version by calling the openssl
// command, falling back to getOpenSSLByTestingLib()
func getOpenSSL() (string, error) {
	out, err := exec.Command("openssl", "version", "-v").CombinedOutput()
	if err != nil {
		if v := getOpenSSLByTestingLib(); v != "" {
			return v, nil
		}
		return "", fmt.Errorf("could not determine openssl version: %s (%w)", string(out), err)
	}
	return parseOpenSSLVersion(string(out)), nil
}

func parseLinuxDistro(str string) string {
	var id string
	var idLike string

	// match everything after `ID=` except quotes and newlines
	idMatches := regexp.MustCompile(`(?m)^ID="?([^"\n]*)"?`).FindStringSubmatch(str)
	if len(idMatches) > 0 {
		id = idMatches[1]
	}

	// match everything after `ID_LIKE=` except quotes and newlines
	idLikeMatches := regexp.MustCompile(`(?m)^ID_LIKE="?([^"\n]*)"?`).FindStringSubmatch(str)
	if len(idLikeMatches) > 0 {
		idLike = idLikeMatches[1]
	}

	if id == "alpine" {
		return "alpine"
	}

	if strings.Contains(idLike, "centos") ||
		strings.Contains(idLike, "fedora") ||
		strings.Contains(idLike, "rhel") ||
		id == "fedora" {
		return "rhel"
	}

	if strings.Contains(idLike, "debian") ||
		strings.Contains(idLike, "ubuntu") ||
		id == "debian" {
		return "debian"
	}

	// default to debian as it's most common
	return "debian"
}

func getLinuxDistro() string {
	filePath := "/etc/os-release"
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "debian"
	}

	return parseLinuxDistro(string(content))
}

// CheckForExtension adds a .exe extension on windows (e.g. .gz -> .exe.gz)
func checkForExtension(platform, path string) string {
	if platform == "windows" {
		if strings.Contains(path, ".gz") {
			return strings.Replace(path, ".gz", ".exe.gz", 1)
		}
		return path + ".exe"
	}
	return path
}

// BinaryPlatformName returns the name of the prisma binary which should be used,
// for example "darwin" or "linux-openssl-1.1.x"
func (e *Engine) BinaryPlatformName() (string, error) {
	if binaryNameWithSSLCache != "" {
		return binaryNameWithSSLCache, nil
	}

	platformName := runtime.GOOS
	if platformName != "linux" {
		return platformName, nil
	}

	distro := getLinuxDistro()
	if distro == "alpine" {
		distro = "linux-musl"
	}

	ssl, err := getOpenSSL()
	if err != nil {
		return "", err
	}

	arch := ""
	if runtime.GOARCH == "arm64" {
		arch = "-arm64"
	}

	name := fmt.Sprintf("%s%s-openssl-%s", distro, arch, ssl)
	binaryNameWithSSLCache = name

	return name, nil
}

func (e *Engine) GetEngineURL(engineName string, binaryPlatformName string) string {
	binaryPlatformRemoteName := binaryPlatformName
	if binaryPlatformRemoteName == "linux" {
		binaryPlatformRemoteName = "linux-musl"
	}
	return checkForExtension(binaryPlatformName, fmt.Sprintf(EngineURL, PrismaBinaryVersion, binaryPlatformRemoteName, engineName))
}

func (e *Engine) FetchEngine(toDir string, engineName string, binaryPlatformName string) error {
	to := checkForExtension(binaryPlatformName, path.Join(toDir, PrismaBinaryVersion, fmt.Sprintf("prisma-%s-%s", engineName, binaryPlatformName)))

	url := e.GetEngineURL(engineName, binaryPlatformName)

	if _, err := os.Stat(to); !os.IsNotExist(err) {
		return nil
	}

	e.log.Debug("downloading", zap.String("url", url))
	if err := download(url, to); err != nil {
		return fmt.Errorf("could not download %s to %s: %w", url, to, err)
	}

	return nil
}
