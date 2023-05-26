package trace

import "go.opentelemetry.io/otel/attribute"

const (
	WgOperationName = attribute.Key("wg.operation.name")
	WgOperationType = attribute.Key("wg.operation.type")
	WgComponentName = attribute.Key("wg.component.name")
)
