package commands

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/v2wundergraphapi"
)

// userCmd represents the user command
var userCmd = &cobra.Command{
	Use:   "userinfo",
	Short: `Display information about your current user profile`,
	RunE: func(cmd *cobra.Command, args []string) error {
		client := InitWunderGraphApiClient()
		userInfo, err := client.GetUserInfo()
		if err != nil {
			_, _ = yellow.Printf("User is not logged in, please use 'wunderctl login'")
			return nil
		}
		printUserInfo(userInfo)
		return nil
	},
}

func printUserInfo(userInfo *v2wundergraphapi.UserInfo) {
	_, _ = green.Println("You are authenticated as:")
	fmt.Printf("%s: %s\n", blue.Sprintf("User ID"), userInfo.ID)
	fmt.Printf("%s: %s\n", blue.Sprintf("Email"), userInfo.Email)
	fmt.Printf("%s: %s\n", blue.Sprintf("FirstName"), userInfo.FirstName)
	fmt.Printf("%s: %s\n", blue.Sprintf("LastName"), userInfo.LastName)
	fmt.Printf("%s: %s\n", blue.Sprintf("DisplayName"), userInfo.DisplayName)
}

func init() {
	rootCmd.AddCommand(userCmd)
}
