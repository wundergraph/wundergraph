package helpers

type RootFlags struct {
	Log        string
	PrettyLogs bool
	// Aka request logging (dumps), enriched error logging
	DebugMode          bool
	Telemetry          bool
	TelemetryDebugMode bool
}
