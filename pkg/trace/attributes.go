package trace

import "go.opentelemetry.io/otel/attribute"

const (
	WgOperationName = attribute.Key("wg.operation.name")
	WgOperationType = attribute.Key("wg.operation.type")
	WgComponentName = attribute.Key("w.component.name")
)

var (
	PublicServerAttribute     = WgComponentName.String("public-server")
	InternalServerAttribute   = WgComponentName.String("internal-server")
	ApiTransportAttribute     = WgComponentName.String("api-transport")
	HooksClientAttribute      = WgComponentName.String("hooks-client")
	WebhookTransportAttribute = WgComponentName.String("webhook-transport")
)
