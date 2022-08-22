package sdkArgs

type logOption string

func WitchLogOption(log string) Option {
	return logOption(log)
}

func (l logOption) ConvertToArgs() []string {
	if l != "" {
		return []string{string(log), string(l)}
	}
	return nil
}
