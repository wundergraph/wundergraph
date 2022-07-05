package commands

import (
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"time"

	"github.com/fatih/color"
	"github.com/wundergraph/wundergraph/pkg/files"

	"github.com/spf13/viper"
	"github.com/wundergraph/wundergraph/pkg/cli/auth"
	"github.com/wundergraph/wundergraph/pkg/config"
	"github.com/wundergraph/wundergraph/pkg/manifest"

	"github.com/jensneuse/abstractlogger"
	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/v2wundergraphapi"

	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/node"
)

var (
	BuildInfo          node.BuildInfo
	GitHubAuthDemo     node.GitHubAuthDemo
	logLevel           string
	DotEnvFile         string
	log                abstractlogger.Logger
	enableDebugMode    bool
	jsonEncodedLogging bool
	wundergraphDir     string
	serviceToken       string

	red    = color.New(color.FgHiRed)
	green  = color.New(color.FgHiGreen)
	blue   = color.New(color.FgHiBlue)
	yellow = color.New(color.FgHiYellow)
	cyan   = color.New(color.FgHiCyan)
	white  = color.New(color.FgHiWhite)
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "wunderctl",
	Short: "wunderctl is the cli to manage, build and debug your WunderGraph applications",
	Long: `wunderctl is the cli to manage, build and debug your WunderGraph applications

Simply running "wunderctl" will check the wundergraph.manifest.json in the current directory and install all dependencies. 

wunderctl is gathering anonymous usage data so that we can better understand how it's being used and improve it.
You can opt out of this by setting the following environment variable: WUNDERGRAPH_DISABLE_METRICS
`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		if enableDebugMode {
			log = buildLogger(abstractlogger.DebugLevel)
		} else {
			log = buildLogger(findLogLevel(abstractlogger.ErrorLevel))
		}

		err := godotenv.Load(DotEnvFile)
		if err != nil {
			if _, ok := err.(*fs.PathError); ok {
				log.Debug("starting without env file")
				return
			}
			log.Fatal("error loading env file",
				abstractlogger.Error(err),
			)
		} else {
			log.Debug("env file successfully loaded",
				abstractlogger.String("file", DotEnvFile),
			)
		}
	},
	Run: func(cmd *cobra.Command, args []string) {
		client := InitWunderGraphApiClient()
		man := manifest.New(log, client, wundergraphDir)
		err := man.Load()
		if err != nil {
			_, _ = red.Printf("unable to load wundergraph.manifest.json")
			return
		}
		err = man.PersistChanges()
		if err != nil {
			_, _ = red.Printf("unable to persist manifest changes")
			return
		}
		err = man.WriteIntegrationsFile()
		if err != nil {
			_, _ = red.Printf("unable to write integrations file")
			return
		}
		_, _ = green.Printf("API dependencies updated\n")
	},
}

func InitWunderGraphApiClient() *v2wundergraphapi.Client {
	token := authenticator().LoadRefreshAccessToken()
	return InitWunderGraphApiClientWithToken(token)
}

func InitWunderGraphApiClientWithToken(token string) *v2wundergraphapi.Client {
	return v2wundergraphapi.New(token, viper.GetString("API_URL"), &http.Client{
		Timeout: time.Second * 10,
	}, log)
}

type BuildTimeConfig struct {
	DefaultApiEndpoint string
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute(buildInfo node.BuildInfo, githubAuthDemo node.GitHubAuthDemo) {
	BuildInfo = buildInfo
	GitHubAuthDemo = githubAuthDemo
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func init() {
	config.InitConfig()

	viper.SetDefault("OAUTH_CLIENT_ID", "wundergraph-production-cli")
	viper.SetDefault("OAUTH_BASE_URL", "https://accounts.wundergraph.com/auth/realms/master")
	viper.SetDefault("API_URL", "https://api.wundergraph.com")

	log = buildLogger(findLogLevel(abstractlogger.ErrorLevel))

	wd, err := os.Getwd()
	if err != nil {
		log.Fatal("could not get your current working directory")
	}

	wgDefaultDir := "."

	dir, err := files.FindDirectory(wd, ".wundergraph")
	if err != nil {
		log.Fatal("could not find .wundergraph directory from your current working directory", abstractlogger.String("wd", wd), abstractlogger.Error(err))
	}

	if dir != "" {
		relPath, err := filepath.Rel(wd, dir)
		if err != nil {
			log.Fatal("could not calculate relative path from your wundergraph directory", abstractlogger.Error(err))
		}
		wgDefaultDir = relPath
	}

	defaultConfigJSONPath := path.Join(wundergraphDir, "generated", "wundergraph.config.json")

	rootCmd.PersistentFlags().StringVarP(&logLevel, "loglevel", "l", "info", "sets the log level")
	rootCmd.PersistentFlags().StringVarP(&wunderGraphConfigFile, "config", "c", defaultConfigJSONPath, "config is the path to the wundergraph config")
	rootCmd.PersistentFlags().StringVarP(&DotEnvFile, "env", "e", ".env", "allows you to set environment variables from an env file")
	rootCmd.PersistentFlags().BoolVar(&enableDebugMode, "debug", false, "enables the debug mode so that all requests and responses will be logged")
	rootCmd.PersistentFlags().BoolVar(&jsonEncodedLogging, "json-encoded-logging", false, "switches the logging to json encoded logging")
	rootCmd.PersistentFlags().StringVar(&wundergraphDir, "wundergraph-dir", wgDefaultDir, "path to your .wundergraph directory")
}

func buildLogger(level abstractlogger.Level) abstractlogger.Logger {
	return logging.New(level, jsonEncodedLogging)
}

func findLogLevel(defaultLevel abstractlogger.Level) abstractlogger.Level {
	switch logLevel {
	case "debug":
		return abstractlogger.DebugLevel
	case "warn":
		return abstractlogger.WarnLevel
	case "error":
		return abstractlogger.ErrorLevel
	case "fatal":
		return abstractlogger.FatalLevel
	case "panic":
		return abstractlogger.PanicLevel
	default:
		return defaultLevel
	}
}

func authenticator() *auth.Authenticator {
	return auth.New(log,
		viper.GetString("OAUTH_BASE_URL"),
		viper.GetString("OAUTH_CLIENT_ID"),
	)
}
