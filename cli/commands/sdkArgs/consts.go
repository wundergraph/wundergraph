package sdkArgs

type CommandType string

// TODO add more wunderctl command
const (
	UP         CommandType = "up"
	Start      CommandType = "start"
	Generate   CommandType = "generate"
	Introspect CommandType = "introspect"
)

type ArgsName string

// TODO add more args name
const (
	log        ArgsName = "--loglevel"
	dir        ArgsName = "--wundergraph-dir"
	addr       ArgsName = "--listen-addr"
	hookAddr   ArgsName = "--middleware-listen-port"
	debug      ArgsName = "--debug"
	forcedJump ArgsName = "--disable-force-https-redirects"
)

type Option interface {
	ConvertToArgs() []string
}
