package hooks

import "github.com/wundergraph/wundergraph/pkg/wgpb"

type HookMatcher struct {
	OperationType wgpb.OperationType
	DataSources   []string
}

type Hook struct {
	Type    wgpb.HookType
	Matcher HookMatcher
}
