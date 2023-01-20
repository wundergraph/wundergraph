package node

type BuildInfo struct {
	Version, Commit, Date, BuiltBy string
}

type GitHubAuthDemo struct {
	ClientID     string
	ClientSecret string
}

type HealthCheckReport struct {
	ServerStatus string    `json:"serverStatus"`
	NodeStatus   string    `json:"nodeStatus"`
	BuildInfo    BuildInfo `json:"buildInfo"`
	DeploymentId string    `json:"deploymentId"`
	CommitSHA    string    `json:"CommitSHA"`
	CommitURL    string    `json:"CommitURL"`
}
