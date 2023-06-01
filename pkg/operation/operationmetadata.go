package operation

import (
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type OperationMetaData struct {
	OperationName string
	OperationType wgpb.OperationType
}

func (o *OperationMetaData) GetOperationTypeString() string {
	switch o.OperationType {
	case wgpb.OperationType_MUTATION:
		return "mutation"
	case wgpb.OperationType_QUERY:
		return "query"
	case wgpb.OperationType_SUBSCRIPTION:
		return "subscription"
	default:
		return "unknown"
	}
}
