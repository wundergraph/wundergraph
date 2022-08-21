package commands

import (
	"os"
)

type CommandType string

// TODO add more wunderctl command
const (
	UP CommandType = "up"
)

type ArgsName string

// TODO add more args name
const (
	dir   ArgsName = "--wundergraph-dir"
	addr  ArgsName = "--listen-addr"
	debug ArgsName = "--debug"
)

type Option interface {
	convertToArgs() []string
}

type dirOption string

func WitchDirOption(dir string) Option {
	return dirOption(dir)
}

func (diro dirOption) convertToArgs() []string {
	if diro != "" {
		return []string{string(dir), string(diro)}
	}
	return nil
}

type addrOption string

func WitchAddrOption(addr string) Option {
	return addrOption(addr)
}

func (addro addrOption) convertToArgs() []string {
	if addro != "" {
		return []string{string(addr), string(addro)}
	}
	return nil
}

type debugOption bool

func WitchDebugOption(debug bool) Option {
	return debugOption(debug)
}

func (debugo debugOption) convertToArgs() []string {
	if debugo {
		return []string{string(debug), "true"}
	}
	return nil
}

type _c struct {
}

func NewClient() API {
	return &_c{}
}

func (c *_c) Execute(command CommandType, opts ...Option) error {
	os.Args = []string{"#", string(command)}
	for _, opt := range opts {
		os.Args = append(os.Args, opt.convertToArgs()...)
	}

	return rootCmd.Execute()
}
