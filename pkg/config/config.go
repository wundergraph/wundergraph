package config

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/segmentio/ksuid"
	"github.com/spf13/viper"

	"github.com/wundergraph/wundergraph/pkg/files"
)

var configDir string

// InitConfig - Initialises config file for Viper
func InitConfig(isTelemetryEnabled bool) {
	if err := initConfigDir(); err != nil {
		fmt.Println("Error accessing config directory at $HOME/.wundergraph", err)
		return
	}

	initViper(isTelemetryEnabled)
}

// ConfigDir - Returns Directory holding the Config file
func ConfigDir() string {
	return configDir
}

// ConfigFilePath - returns the path to the config file
func ConfigFilePath() string {
	return filepath.Join(configDir, "config.json")
}

func initConfigDir() error {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	dir := filepath.Join(homeDir, ".wundergraph")

	if !files.DirectoryExists(dir) {
		if err := os.MkdirAll(dir, 0700); err != nil {
			return err
		}
	}

	configDir = dir

	return nil
}

func initViper(isTelemetryEnabled bool) {
	if err := loadConfig(); err != nil {
		fmt.Println("Error loading config", err)
	}

	// Init anonymous user id that is used to distinguish between different users
	if isTelemetryEnabled && !viper.InConfig("anonymousID") {
		viper.Set("anonymousID", ksuid.New().String())
		allSettings := viper.AllSettings()
		if err := SaveConfig(allSettings); err != nil {
			log.Printf("Could not save config: %v\n", err)
		}
	}

	viper.SetEnvPrefix("WG")
	viper.AutomaticEnv()
}

func loadConfig() error {
	if configDir == "" {
		return nil
	}

	viper.SetConfigName("config")
	viper.SetConfigType("json")
	viper.AddConfigPath(ConfigDir())

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			ioutil.WriteFile(ConfigFilePath(), []byte(`{}`), 0600)
		} else {
			log.Fatalf("could not read config: %v\n", err)
		}
	}

	return nil
}

func SaveConfig(allSettings map[string]interface{}) error {
	out := map[string]interface{}{}

	for key, val := range allSettings {
		if persistConfigKey(key) {
			out[key] = val
		}
	}

	data, err := json.MarshalIndent(&out, "", "\t")
	if err != nil {
		return err
	}

	return ioutil.WriteFile(ConfigFilePath(), data, 0600)
}

var writeableConfigKeys = []string{"auth", "anonymousid"}

func persistConfigKey(key string) bool {
	for _, k := range writeableConfigKeys {
		if k == key || strings.HasPrefix(key, k+".") {
			return true
		}
	}

	return false
}
