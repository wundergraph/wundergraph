package commands

import (
	"context"
	"github.com/wundergraph/wundergraph/cli/commands/sdkArgs"
)

type API interface {
	Execute(commandType sdkArgs.CommandType, opt ...sdkArgs.Option) error
	Stop() error
	NodeState() bool
	CheckIntrospect(dbType, databaseURL string) (err error)
	WdgStart(ctx context.Context, argConfig []byte) (err error)
	Generate(ctx context.Context, argConfig []byte) error
}
