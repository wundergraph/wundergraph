package sdkArgs

type forcedJumpOption string

func WitchForcedJumpOption(forcedJump string) Option {
	return forcedJumpOption(forcedJump)
}

func (f forcedJumpOption) ConvertToArgs() []string {
	if f != "" {
		return []string{string(forcedJump)}
	}
	return nil
}
