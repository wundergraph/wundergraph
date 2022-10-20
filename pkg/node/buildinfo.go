package node

type BuildInfo struct {
	Version, Commit, Date, BuiltBy string
}

type GitHubAuthDemo struct {
	ClientID     string
	ClientSecret string
}

type HealthCheck struct {
	ServerStatus string    `json:"serverStatus"`
	NodeStatus   string    `json:"nodeStatus"`
	BuildInfo    BuildInfo `json:"buildInfo"`
}
