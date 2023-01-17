package helpers

import "strings"

type TelemetryAnnotation int

const (
	TelemetryAnnotationCommand TelemetryAnnotation = 1 << iota
	TelemetryAnnotationDataSources
)

const (
	telemetryKey       = "telemetry"
	telemetryFieldsSep = "|"
)

func (t TelemetryAnnotation) String() string {
	var values []string
	if t&TelemetryAnnotationCommand != 0 {
		values = append(values, "command")
	}
	if t&TelemetryAnnotationDataSources != 0 {
		values = append(values, "dataSources")
	}
	return strings.Join(values, telemetryFieldsSep)
}

func TelemetryAnnotations(annotations TelemetryAnnotation) map[string]string {
	return map[string]string{
		telemetryKey: annotations.String(),
	}
}

func HasTelemetryAnnotations(annotations TelemetryAnnotation, values map[string]string) bool {
	telemetryValues := strings.Split(values[telemetryKey], telemetryFieldsSep)
	requested := strings.Split(annotations.String(), telemetryFieldsSep)
	for _, req := range requested {
		found := false
		for _, val := range telemetryValues {
			if val == req {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}
