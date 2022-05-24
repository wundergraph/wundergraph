package commands

import (
	"errors"

	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/v2wundergraphapi"
)

// loginCmd represents the login command
var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Login to wundergraph.com",
	Long:  `Authenticate against wundergraph.com to access private and privileged services.`,
	Run: func(cmd *cobra.Command, args []string) {
		token := authenticator().Login()
		client := InitWunderGraphApiClientWithToken(token)
		userInfo, err := client.GetUserInfo()
		if err != nil {
			if errors.Is(err, v2wundergraphapi.ErrInvalidLogin) {
				authenticator().Logout()
				_, _ = red.Printf("Invalid login credentials, please try 'wunderctl login' again\n")
				return
			}
			_, _ = red.Printf("Error: %s\n", err.Error())
			return
		}

		printUserInfo(userInfo)
	},
}

func init() {
	rootCmd.AddCommand(loginCmd)
}
