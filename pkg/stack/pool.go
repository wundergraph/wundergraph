package stack

import (
	"context"
	"fmt"
	"net"
	"runtime"
	"time"

	"github.com/cenkalti/backoff"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	dc "github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
)

type Pool struct {
	client *dc.Client
}

type Resource struct {
	container *types.ContainerJSON
}

type RunOptions struct {
	Repository   string
	Tag          string
	Env          []string
	Entrypoint   []string
	Cmd          []string
	Binds        []string
	ExposedPorts []string
	PortBindings map[string][]PortBinding
	RetryFunc    func() error
}

type PortBinding struct {
	HostIP   string
	HostPort string
}

func NewPool(ctx context.Context) (*Pool, error) {
	host := dc.DefaultDockerHost
	if isWindowsOS() {
		host = "http://localhost:2375"
	}

	client, err := dc.NewClientWithOpts(
		dc.WithHost(host),
		dc.WithAPIVersionNegotiation(),
	)
	if err != nil {
		return nil, err
	}

	_, err = client.Ping(ctx)
	if err != nil {
		return nil, err
	}

	return &Pool{client: client}, nil
}

func (p *Pool) Run(ctx context.Context, opts *RunOptions) (*Resource, error) {
	//imageName := fmt.Sprintf("%s:%s", opts.Repository, opts.Tag)
	imageName := opts.Repository

	_, _, err := p.client.ImageInspectWithRaw(ctx, imageName)
	if err != nil {
		out, err := p.client.ImagePull(ctx, imageName, types.ImagePullOptions{})
		if err != nil {
			return nil, err
		}
		defer func() {
			_ = out.Close()
		}()
	}

	exposedPorts := make(map[nat.Port]struct{})
	for _, port := range opts.ExposedPorts {
		exposedPorts[nat.Port(port)] = struct{}{}
	}

	portBindings := make(map[nat.Port][]nat.PortBinding)
	for port, bindings := range opts.PortBindings {
		for _, binding := range bindings {
			portBindings[nat.Port(port)] = append(portBindings[nat.Port(port)], nat.PortBinding{
				HostIP:   binding.HostIP,
				HostPort: binding.HostPort,
			})
		}
	}

	resp, err := p.client.ContainerCreate(
		ctx,
		&container.Config{
			Image:        imageName,
			Env:          opts.Env,
			Entrypoint:   opts.Entrypoint,
			Cmd:          opts.Cmd,
			ExposedPorts: exposedPorts,
		},
		&container.HostConfig{
			PortBindings:    portBindings,
			PublishAllPorts: true,
			Binds:           opts.Binds,
		},
		nil,
		nil,
		"",
	)
	if err != nil {
		return nil, err
	}

	if err := p.client.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
		return nil, err
	}

	c, err := p.client.ContainerInspect(ctx, resp.ID)
	if err != nil {
		return nil, err
	}

	if opts.RetryFunc != nil {
		if err := retry(opts.RetryFunc); err != nil {
			return nil, err
		}
	}

	return &Resource{
		container: &c,
	}, nil
}

func (p *Pool) Purge(ctx context.Context, r *Resource) error {
	return p.client.ContainerRemove(
		ctx,
		r.container.ID,
		types.ContainerRemoveOptions{
			Force: true,
		},
	)
}

func (p *Pool) Stop(ctx context.Context, r *Resource) error {
	return p.client.ContainerStop(
		ctx,
		r.container.ID,
		nil,
	)
}

func (r *Resource) GetHostPort(portID string) string {
	if r.container == nil || r.container.NetworkSettings == nil {
		return ""
	}

	m, ok := r.container.NetworkSettings.Ports[nat.Port(portID)]
	if !ok || len(m) == 0 {
		return ""
	}

	ip := m[0].HostIP
	if ip == "0.0.0.0" {
		ip = "localhost"
	}

	return net.JoinHostPort(ip, m[0].HostPort)
}

func retry(op func() error) error {
	bo := backoff.NewExponentialBackOff()
	bo.MaxInterval = time.Second * 5
	bo.MaxElapsedTime = time.Minute

	return backoff.Retry(op, bo)
}

func isWindowsOS() bool {
	switch runtime.GOOS {
	case "windows":
		return true
	default:
		return false
	}
}

func getPortID(port int) string {
	return fmt.Sprintf("%d/tcp", port)
}
