package codegeneration

import (
	"os"
	"strings"
)

const (
	// Legacy entrypoint, used by default
	configEntryPointFilename = "wundergraph.config.ts"
	// Entrypoint for applications that use `export default defineConfig` inside generatedDirectory
	applicationEntryPointFilename = "wundergraph.application.ts"

	serverConfigFilename = "wundergraph.server.ts"

	serverEntryPointFilename = "server.ts"

	// generatedDirectory is the relative path to the directory with generated
	// from $WUNDERGRAPH_DIR
	generatedDirectory = "generated"
)

func hasApplicationConfig(configEntry string) (bool, error) {
	b, err := os.ReadFile(configEntry)
	if err != nil {
		return false, err
	}
	s := string(b)
	return strings.Contains(s, "export default defineConfig") || strings.Contains(s, "WunderGraphConfig"), nil
}