package sdkArgs

type hookAddrOption string

func WitchHookAddrOption(addr string) Option {
	return hookAddrOption(addr)
}

func (h hookAddrOption) ConvertToArgs() []string {
	if h != "" {
		return []string{string(hookAddr), string(h)}
	}
	return nil
}
