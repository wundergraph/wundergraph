package sdkArgs

const (
	DebugOn  = "true"
	DebugOff = "false"
)

type debugOption bool

func WitchDebugOption(debug bool) Option {
	return debugOption(debug)
}

func (d debugOption) ConvertToArgs() []string {
	if d {
		return []string{string(debug)}
	}
	return nil
}
