package commands

import "github.com/wundergraph/wundergraph/cli/commands/sdkArgs"

type API interface {
	Execute(commandType sdkArgs.CommandType, opt ...sdkArgs.Option) error
}
