package commands

import (
	"github.com/spf13/cobra"
)

// loginCmd represents the login command
var logoutCmd = &cobra.Command{
	Use:   "logout",
	Short: "Logout from wundergraph.com",
	Run: func(cmd *cobra.Command, args []string) {
		authenticator().Logout()
		_, _ = green.Println("Successfully logged out")
	},
}

func init() {
	rootCmd.AddCommand(logoutCmd)
}
