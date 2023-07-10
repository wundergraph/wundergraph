package telemetry

import (
	"strconv"
)

// Annotation indicates which data should be reported as telemetry when a wunderctl command is ran
type Annotation int

const (
	// AnnotationCommand indicates the annotated command usage and duration should be reported as telemetry
	AnnotationCommand Annotation = 1 << iota
	// AnnotationDataSources indicates the data sources should be reported as telemetry
	AnnotationDataSources
	// AnnotationFeatures indicates that the used features should be reported as telemetry
	AnnotationFeatures
)

const (
	annotationsKey = "telemetry"
)

func Annotations(annotations Annotation) map[string]string {
	return map[string]string{
		annotationsKey: strconv.Itoa(int(annotations)),
	}
}

func HasAnnotations(annotations Annotation, values map[string]string) bool {
	val, _ := strconv.Atoi(values[annotationsKey])
	return val&int(annotations) != 0
}
