package sdkArgs

type introspectOption string

func WitchIntrospectOption(introspect string) Option {
	return introspectOption(introspect)
}

func (i introspectOption) ConvertToArgs() []string {
	if i != "" {
		return []string{string(Introspect), string(i)}
	}
	return nil
}
