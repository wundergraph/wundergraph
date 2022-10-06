package commands

import (
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"time"

	"github.com/fatih/color"
	"github.com/jensneuse/abstractlogger"
	"github.com/joho/godotenv"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/wundergraph/wundergraph/pkg/cli/auth"
	"github.com/wundergraph/wundergraph/pkg/config"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/logging"
	"github.com/wundergraph/wundergraph/pkg/manifest"
	"github.com/wundergraph/wundergraph/pkg/node"
	"github.com/wundergraph/wundergraph/pkg/v2wundergraphapi"
)

const (
	configJsonFilename       = "wundergraph.config.json"
	configEntryPointFilename = "wundergraph.config.ts"
	serverEntryPointFilename = "wundergraph.server.ts"
)

var (
	BuildInfo             node.BuildInfo
	GitHubAuthDemo        node.GitHubAuthDemo
	logLevel              string
	DotEnvFile            string
	log                   abstractlogger.Logger
	enableDebugMode       bool
	jsonEncodedLogging    bool
	serviceToken          string
	_wunderGraphDirConfig string
	disableCache          bool

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
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {

		if enableDebugMode {
			log = buildLogger(abstractlogger.DebugLevel)
		} else {
			log = buildLogger(findLogLevel(abstractlogger.ErrorLevel))
		}

		err := godotenv.Load(DotEnvFile)
		if err != nil {
			if _, ok := err.(*fs.PathError); ok {
				log.Debug("starting without env file")
				return nil
			}
			log.Fatal("error loading env file",
				abstractlogger.Error(err),
			)
		} else {
			log.Debug("env file successfully loaded",
				abstractlogger.String("file", DotEnvFile),
			)
		}
		return nil
	},
	RunE: func(cmd *cobra.Command, args []string) error {
		client := InitWunderGraphApiClient()
		wunderGraphDir, err := files.FindWunderGraphDir(_wunderGraphDirConfig)
		if err != nil {
			return err
		}
		man := manifest.New(log, client, wunderGraphDir)
		err = man.Load()
		if err != nil {
			return fmt.Errorf("unable to load wundergraph.manifest.json")
		}
		err = man.PersistChanges()
		if err != nil {
			return fmt.Errorf("unable to persist manifest changes")
		}
		err = man.WriteIntegrationsFile()
		if err != nil {
			return fmt.Errorf("unable to write integrations file")
		}
		_, _ = green.Printf("API dependencies updated\n")
		return nil
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

	rootCmd.PersistentFlags().StringVarP(&logLevel, "loglevel", "l", "info", "sets the log level")
	rootCmd.PersistentFlags().StringVarP(&DotEnvFile, "env", "e", ".env", "allows you to set environment variables from an env file")
	rootCmd.PersistentFlags().BoolVar(&enableDebugMode, "debug", false, "enables the debug mode so that all requests and responses will be logged")
	rootCmd.PersistentFlags().BoolVar(&jsonEncodedLogging, "json-encoded-logging", false, "switches the logging to json encoded logging")
	rootCmd.PersistentFlags().StringVar(&_wunderGraphDirConfig, "wundergraph-dir", files.WunderGraphDirName, "path to your .wundergraph directory")
	rootCmd.PersistentFlags().BoolVar(&disableCache, "no-cache", false, "Disable cache")
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
