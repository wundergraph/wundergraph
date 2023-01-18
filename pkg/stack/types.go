package stack

// common
const (
	defaultHost = "localhost"
)

// file storage
const (
	defaultS3Repository    = "minio/minio"
	defaultS3RepositoryTag = "latest"
	defaultS3Port          = 9000
	defaultS3DashboardPort = 9001
	defaultS3ClientID      = "dev"
	defaultS3ClientSecret  = "12345678"
	defaultS3Dir           = "/data"
)

type Stack string

func (s Stack) String() string {
	return string(s)
}

const (
	S3 Stack = "s3"
)

func GetDefaultS3PortID() string {
	return getPortID(defaultS3Port)
}
