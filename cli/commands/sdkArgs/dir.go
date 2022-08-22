package sdkArgs

type dirOption string

func WitchDirOption(dir string) Option {
	return dirOption(dir)
}

func (d dirOption) ConvertToArgs() []string {
	if d != "" {
		return []string{string(dir), string(d)}
	}
	return nil
}
