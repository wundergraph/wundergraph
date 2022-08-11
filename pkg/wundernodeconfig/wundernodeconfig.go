package wundernodeconfig

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	LoadConfig *LoadConfig
	Server     *ServerConfig
}

type ServerConfig struct {
	ListenAddr string `envconfig:"server_listen_addr" default:"localhost:443"`
	ListenTLS  bool   `envconfig:"listen_tls" default:"true"`
}

type LoadConfig struct {
	URL              string        `envconfig:"load_config_url" default:"https://api.wundergraph.com"`
	BearerToken      string        `envconfig:"load_config_token" required:"false"`
	PollingInterval  time.Duration `envconfig:"load_config_polling_interval" default:"10s"`
	CachedConfigPath string        `envconfig:"load_config_cached_config_path" default:"/tmp/wundernode_config.json"`
}

func Load(production bool) (*Config, error) {
	if !production {
		return loadDevConfig()
	}
	var serverConfig ServerConfig
	var loadConfig LoadConfig
	err := load("wundernode",
		&serverConfig,
		&loadConfig,
	)
	if err != nil {
		return nil, err
	}
	return &Config{
		Server:     &serverConfig,
		LoadConfig: &loadConfig,
	}, err
}

func load(prefix string, specifications ...interface{}) error {
	for i := range specifications {
		err := envconfig.Process(prefix, specifications[i])
		if err != nil {
			return fixError(prefix, err)
		}
	}
	return nil
}

func fixError(prefix string, err error) error {
	message := err.Error()
	if strings.Contains(message, "required key ") {
		return errors.New(strings.Replace(message, "required key ", fmt.Sprintf("required key %s_", strings.ToUpper(prefix)), -1))
	}
	return err
}

func loadDevConfig() (*Config, error) {
	return &Config{
		LoadConfig: &LoadConfig{
			URL: "http://localhost:8080",
			// URL: "https://api.wundergraph.com/wundernode/config",
			// BearerToken: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ3dW5kZXJub2RlIiwic3ViIjoiNTJlYjJmYjUtOWMyNS00Y2U0LWFjNTAtZDgzODA1YjdlNTUxIiwiZXhwIjoxNjE1Mjg1NTM4LCJpYXQiOjE2MTI2OTM1Mzh9.MZMXyC7gc-j_FxuvaMXQiEgPpREyiE0S-R2b10Rn_LQ-n3RsuPjj-p35c5fEIkaw0RU9pKePjOs86sol72YUCQ",
			BearerToken: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ3dW5kZXJub2RlIiwic3ViIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAzIiwiZXhwIjoxNjE5NDM2ODM4LCJpYXQiOjE2MTY4NDQ4Mzh9.J81gmbb1vO7YLNGRa3ILeNv9NVpvdPZxryT_2KADrkGhWNzXJOKVKeCBzWl4etSQA48hHUQBh3X8uayHo12nbw",
		},
		Server: &ServerConfig{
			ListenAddr: ":9991",
			ListenTLS:  true,
		},
	}, nil
}
