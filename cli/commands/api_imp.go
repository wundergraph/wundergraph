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
