package node

type BuildInfo struct {
	Version, Commit, Date, BuiltBy string
}

type GitHubAuthDemo struct {
	ClientID     string
	ClientSecret string
}

type HealthCheck struct {
	Status    string    `json:"status"`
	BuildInfo BuildInfo `json:"buildInfo"`
}
