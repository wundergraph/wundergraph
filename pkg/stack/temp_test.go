package stack_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/wundergraph/wundergraph/pkg/stack"
)

func TestTemp(t *testing.T) {
	ctx := context.Background()
	pool, err := stack.NewPool(ctx)
	require.NoError(t, err)

	resource, err := pool.Run(ctx, &stack.RunOptions{
		Repository:   "minio/minio",
		Tag:          "latest",
		Cmd:          []string{"server", "--address", ":9000", "--console-address", ":9001", "/data"},
		ExposedPorts: []string{"9000/tcp", "9001/tcp"},
		PortBindings: map[string][]stack.PortBinding{
			"9000/tcp": {{HostIP: "localhost", HostPort: "9000"}},
			"9001/tcp": {{HostIP: "localhost", HostPort: "9001"}},
		},
		Env: []string{"MINIO_ROOT_USER=test", "MINIO_ROOT_PASSWORD=12345678"},
	})
	require.NoError(t, err)

	require.NoError(t, pool.Stop(ctx, resource))
	require.NoError(t, pool.Purge(ctx, resource))
}
