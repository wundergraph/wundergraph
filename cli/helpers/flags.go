package helpers

type RootFlags struct {
	CliLogLevel string
	PrettyLogs  bool
	// Aka request logging (dumps), enriched error logging
	DebugMode          bool
	Telemetry          bool
	TelemetryDebugMode bool
}
