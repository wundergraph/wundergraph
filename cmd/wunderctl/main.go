package main

import (
	"os"

	"github.com/wundergraph/wundergraph/cli/commands"
	"github.com/wundergraph/wundergraph/pkg/node"
)

// trigger

var (
	version                    = "dev"
	commit                     = "unknown"
	date                       = "unknown"
	builtBy                    = "unknown"
	githubAuthDemoClientID     = "unknown"
	githubAuthDemoClientSecret = "unknown"
)

func main() {
	if clientID, ok := os.LookupEnv("GH_WG_AUTH_DEMO_CLIENT_ID"); ok {
		githubAuthDemoClientID = clientID
	}
	if secret, ok := os.LookupEnv("GH_WG_AUTH_DEMO_CLIENT_SECRET"); ok {
		githubAuthDemoClientSecret = secret
	}
	commands.Execute(node.BuildInfo{
		Version: version,
		Commit:  commit,
		Date:    date,
		BuiltBy: builtBy,
	},
		node.GitHubAuthDemo{
			ClientID:     githubAuthDemoClientID,
			ClientSecret: githubAuthDemoClientSecret,
		})
}
