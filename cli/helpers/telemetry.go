package helpers

import (
	"strconv"
)

type TelemetryAnnotation int

const (
	TelemetryAnnotationCommand TelemetryAnnotation = 1 << iota
	TelemetryAnnotationDataSources
)

const (
	telemetryAnnotationsKey = "telemetry"
)

func TelemetryAnnotations(annotations TelemetryAnnotation) map[string]string {
	return map[string]string{
		telemetryAnnotationsKey: strconv.Itoa(int(annotations)),
	}
}

func HasTelemetryAnnotations(annotations TelemetryAnnotation, values map[string]string) bool {
	val, _ := strconv.Atoi(values[telemetryAnnotationsKey])
	return val&int(annotations) != 0
}
