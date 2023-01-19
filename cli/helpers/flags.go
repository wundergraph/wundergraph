package helpers

type RootFlags struct {
	CliLogLevel        string
	PrettyLogs         bool
	DebugMode          bool
	Telemetry          bool
	TelemetryDebugMode bool
	// Pretty makes the output of the cli pretty printed
	Pretty bool
}
