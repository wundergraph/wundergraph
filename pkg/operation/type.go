package operation

import (
	"fmt"

	"github.com/wundergraph/graphql-go-tools/pkg/ast"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type Type int

const (
	TypeInvalid Type = iota
	TypeQuery
	TypeMutation
	TypeSubscription
)

func (t Type) String() string {
	switch t {
	case TypeInvalid:
		return "invalid"
	case TypeQuery:
		return "query"
	case TypeMutation:
		return "mutation"
	case TypeSubscription:
		return "subscription"
	}
	panic(fmt.Errorf("unhandled operation.Type %d", int(t)))
}

func TypeFromOperationType(typ wgpb.OperationType) Type {
	switch typ {
	case wgpb.OperationType_INVALID:
		return TypeInvalid
	case wgpb.OperationType_QUERY:
		return TypeQuery
	case wgpb.OperationType_MUTATION:
		return TypeMutation
	case wgpb.OperationType_SUBSCRIPTION:
		return TypeSubscription
	}
	panic(fmt.Errorf("unhandled wgpb.OperationType %d", int(typ)))
}

func TypeFromASTOperationType(typ ast.OperationType) Type {
	switch typ {
	case ast.OperationTypeUnknown:
		return TypeInvalid
	case ast.OperationTypeQuery:
		return TypeQuery
	case ast.OperationTypeMutation:
		return TypeMutation
	case ast.OperationTypeSubscription:
		return TypeSubscription
	}
	panic(fmt.Errorf("unhandled ast.OperationType %d", int(typ)))
}
