package commands

import (
	"fmt"
	"github.com/wundergraph/wundergraph/cli/commands/sdkArgs"
	"os"
)

type _c struct {
}

func NewClient() API {
	return &_c{}
}

func (c *_c) Execute(command sdkArgs.CommandType, opts ...sdkArgs.Option) error {
	os.Args = []string{"#", string(command)}
	for _, opt := range opts {
		os.Args = append(os.Args, opt.ConvertToArgs()...)
	}
	ss := os.Args
	fmt.Println(ss)
	return rootCmd.Execute()
}

func (c *_c) NodeState() bool {
	if SdkNode.Node == nil {
		return false
	}
	return SdkNode.Node.State()
}

func (c *_c) Stop() error {
	if configRunnerSdk != nil {
		configRunnerSdk.Stop()
	}
	if configIntrospectionRunnerSdk != nil {
		configRunnerSdk.Stop()
	}
	if hookServerRunnerSdk != nil {
		configRunnerSdk.Stop()
	}
	if SdkNode.Node != nil {
		err := SdkNode.Node.Close()
		SdkNode.Node = nil
		fmt.Println(err)
	}
	
	return nil
}
