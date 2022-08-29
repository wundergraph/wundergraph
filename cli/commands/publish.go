package commands

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	"strings"

	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/files"
	"github.com/wundergraph/wundergraph/pkg/v2wundergraphapi"
)

// publishCmd represents the publish command
var publishCmd = &cobra.Command{
	Use:   "publish",
	Short: "wunderctl publish organization/api",
	Long: `Publishes one or more APIs to the WunderHub.

This command should be executed from your project root directory.
The APIs to publish need to be generated into the .wundergraph/generated directory.`,
	Example: `wunderctl publish organization/api`,
	Args:    cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		wgDir, err := files.FindWunderGraphDir(wundergraphDir)
		if err != nil {
			return files.ErrWunderGraphDirNotFound(err)
		}

		var client *v2wundergraphapi.Client
		if serviceToken != "" {
			client = InitWunderGraphApiClientWithToken(serviceToken)
		} else {
			client = InitWunderGraphApiClient()
		}

		for _, arg := range args {
			orgAndApi := strings.Split(arg, "/")
			if len(orgAndApi) != 2 {
				_, _ = red.Printf("invalid API name: '%s', must be \"org/api\"\n", arg)
				continue
			}
			org := orgAndApi[0]
			api := orgAndApi[1]
			apiName := fmt.Sprintf("%s/%s", org, api)
			fileName := fmt.Sprintf("%s.%s.api.json", org, api)
			filePath := path.Join(wgDir, "generated", fileName)

			if _, err := os.Stat(filePath); os.IsNotExist(err) {
				_, _ = red.Printf("API file does not exist: %s\n", filePath)
				continue
			}

			content, err := os.ReadFile(filePath)
			if err != nil {
				_, _ = red.Printf("could not read API file: %s\n", filePath)
				continue
			}

			var dependency v2wundergraphapi.ApiDependency
			err = json.Unmarshal(content, &dependency)
			if err != nil {
				_, _ = red.Printf("error parsing API file: %s\n", filePath)
				continue
			}

			err = client.PublishApiDependency(dependency)
			if err != nil {
				_, _ = red.Printf("error publishing API '%s': %s\n", apiName, err.Error())
				continue
			}

			_, _ = green.Printf("API '%s' has been published successfully!\n", apiName)
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(publishCmd)
	publishCmd.PersistentFlags().StringVar(&serviceToken, "service-token", "", "sets the service token")
}
