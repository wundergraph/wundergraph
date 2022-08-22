package sdkArgs

type hookAddrOption string

func WitchHookAddrOption(log string) Option {
	return hookAddrOption(log)
}

func (h hookAddrOption) ConvertToArgs() []string {
	if h != "" {
		return []string{string(hookAddr), string(h)}
	}
	return nil
}
