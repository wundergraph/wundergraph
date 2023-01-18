package stack

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"sync"

	"go.uber.org/zap"
	"golang.org/x/sync/errgroup"
)

type Config struct {
	Log            *zap.Logger
	WunderGraphDir string

	// temporary
	IsFileStorageEnabled bool
}

type Runner struct {
	config    *Config
	log       *zap.Logger
	pool      *Pool
	stacks    map[Stack]*RunOptions
	Resources map[Stack]*Resource

	rw sync.RWMutex
}

func NewRunner(ctx context.Context, config *Config) (*Runner, error) {
	pool, err := NewPool(ctx)
	if err != nil {
		return nil, err
	}

	stacks := make(map[Stack]*RunOptions)

	if config.IsFileStorageEnabled {
		opts, err := fileStorageRunOptions()
		if err != nil {
			return nil, err
		}

		storageDir := filepath.Join(config.WunderGraphDir, "generated/stack/s3", defaultS3Dir)
		err = os.MkdirAll(
			storageDir,
			os.ModePerm,
		)
		if err != nil {
			return nil, err
		}

		opts.Binds = []string{
			fmt.Sprintf("%s:%s", storageDir, defaultS3Dir),
		}

		stacks[S3] = opts
	}

	return &Runner{
		config:    config,
		pool:      pool,
		stacks:    stacks,
		Resources: make(map[Stack]*Resource),
		log:       config.Log,
	}, nil
}

func (r *Runner) Run(ctx context.Context) error {
	eg := errgroup.Group{}

	for stack, opts := range r.stacks {
		eg.Go(func() error {
			resource, err := r.pool.Run(ctx, opts)
			if err != nil {
				return err
			}

			r.rw.Lock()
			r.Resources[stack] = resource
			r.rw.Unlock()

			return nil
		})
	}

	go r.stop(ctx)

	if err := eg.Wait(); err != nil {
		return err
	}

	return nil
}

func (r *Runner) stop(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			r.rw.RLock()
			for stack, resource := range r.Resources {
				err := r.pool.Purge(context.Background(), resource)
				if err != nil {
					r.log.Error("failed to purge resource", zap.String("resource", stack.String()), zap.Error(err))
				}
			}
			r.rw.RUnlock()

			return
		default:
		}
	}
}

func fileStorageRunOptions() (*RunOptions, error) {
	serverPort := getAvailablePort(defaultS3Port)
	if serverPort == -1 {
		return nil, fmt.Errorf("server port %d is not available", serverPort)
	}

	dashboardPort := getAvailablePort(defaultS3DashboardPort)
	if dashboardPort == serverPort {
		dashboardPort = getAvailablePort(dashboardPort + 1)
	}
	if dashboardPort == -1 {
		return nil, fmt.Errorf("dasboard port %d is not available", dashboardPort)
	}

	return &RunOptions{
		Repository: defaultS3Repository,
		Tag:        defaultS3RepositoryTag,
		Cmd: []string{
			"server", "--address", fmt.Sprintf(":%d", serverPort),
			"--console-address", fmt.Sprintf(":%d", dashboardPort),
			defaultS3Dir,
		},
		ExposedPorts: []string{
			getPortID(serverPort),
			getPortID(dashboardPort),
		},
		PortBindings: map[string][]PortBinding{
			getPortID(defaultS3Port): {
				{HostIP: defaultHost, HostPort: fmt.Sprintf("%d", serverPort)},
			},
			getPortID(defaultS3DashboardPort): {
				{HostIP: defaultHost, HostPort: fmt.Sprintf("%d", dashboardPort)},
			},
		},
		Env: []string{
			fmt.Sprintf("MINIO_ROOT_USER=%s", defaultS3ClientID),
			fmt.Sprintf("MINIO_ROOT_PASSWORD=%s", defaultS3ClientSecret),
		},
		RetryFunc: fileStorageRetryFunc(defaultHost, serverPort),
	}, nil
}

func getAvailablePort(port int) int {
	conn, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		for i := port; i < 65535; i++ {
			conn, err = net.Listen("tcp", fmt.Sprintf(":%d", i))
			if err == nil {
				_ = conn.Close()

				return i
			}
		}

		return -1
	}

	_ = conn.Close()
	return port
}

func fileStorageRetryFunc(host string, port int) func() error {
	endpoint := fmt.Sprintf("%s:%d", host, port)

	return func() error {
		url := fmt.Sprintf("http://%s/minio/health/live", endpoint)
		resp, err := http.Get(url)
		if err != nil {
			return err
		}

		if resp.StatusCode != http.StatusOK {
			return fmt.Errorf("could not connect to minio status code: %d", resp.StatusCode)
		}

		return nil
	}
}
