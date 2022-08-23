package sdkArgs

type customOption string

func WitchCustomOption(arg string) Option {
	return customOption(arg)
}

func (c customOption) ConvertToArgs() []string {
	if c != "" {
		return []string{string(c)}
	}
	return nil
}
