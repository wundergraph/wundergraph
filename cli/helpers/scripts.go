package helpers

import (
	"os"
	"strings"

	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/scriptrunner"
)

func ScriptRunnerOutputConfig(flags RootFlags) *scriptrunner.OutputConfig {
	var pipe func(line string) string
	if flags.PrettyLogs {
		prettifier := logging.NewPrettifier(logging.PrettifierConfig{
			IgnoredKeys: []string{"pid", "hostname"},
		})
		pipe = func(line string) string {
			pretty, err := prettifier.PrettifyJSON(strings.NewReader(line))
			if err != nil {
				return line
			}
			defer pretty.Free()
			return pretty.String()
		}
	}
	return &scriptrunner.OutputConfig{
		Stdout: os.Stdout,
		Stderr: os.Stderr,
		Pipe:   pipe,
	}
}
