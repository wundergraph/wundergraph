package operation

import (
	"context"
	"net/http"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

var key = "operationMetaData"

func SetOperationMetaData(r *http.Request, operation *wgpb.Operation) *http.Request {
	metaData := &OperationMetaData{
		OperationName: operation.Name,
		OperationType: operation.OperationType,
	}
	return r.WithContext(context.WithValue(r.Context(), key, metaData))
}

func GetOperationMetaData(ctx context.Context) *OperationMetaData {
	if ctx == nil {
		return nil
	}
	maybeMetaData := ctx.Value(key)
	if maybeMetaData == nil {
		return nil
	}
	return maybeMetaData.(*OperationMetaData)
}
