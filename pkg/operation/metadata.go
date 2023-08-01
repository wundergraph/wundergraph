package operation

import (
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Metadata struct {
	OperationName string
	OperationType Type
}

func NewMetadata(op *wgpb.Operation) *Metadata {
	return &Metadata{
		OperationName: op.Name,
		OperationType: TypeFromOperationType(op.OperationType),
	}
}
