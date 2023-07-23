package config

import (
	"os"
	"path/filepath"

	"google.golang.org/protobuf/proto"

	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

// WunderGraphApplicationConfig returns the configuration for the WunderGraph application
// at the given directory
func WunderGraphApplicationConfig(wunderGraphDir string) (*wgpb.WunderGraphConfiguration, error) {
	configFile := filepath.Join(wunderGraphDir, "generated", "wundergraph.wgconfig")
	configData, err := os.ReadFile(configFile)
	if err != nil {
		return nil, err
	}
	var wgConfig wgpb.WunderGraphConfiguration
	if err := proto.Unmarshal(configData, &wgConfig); err != nil {
		return nil, err
	}
	return &wgConfig, nil
}
