package sdkArgs

type addrOption string

func WitchAddrOption(addr string) Option {
	return addrOption(addr)
}

func (d addrOption) ConvertToArgs() []string {
	if d != "" {
		return []string{string(addr), string(d)}
	}
	return nil
}
