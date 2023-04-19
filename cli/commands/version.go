package commands

import (
	"github.com/spf13/cobra"
)

// versionCmd represents the version command
var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Display version information for the wunderctl",
	Run: func(cmd *cobra.Command, args []string) {
		_, _ = blue.Printf("Version: %s\n", white.Sprint(BuildInfo.Version))
		_, _ = blue.Printf("Commit: %s\n", white.Sprint(BuildInfo.Commit))
		_, _ = blue.Printf("Date: %s\n", white.Sprint(BuildInfo.Date))
		_, _ = blue.Printf("BuiltBy: %s\n", white.Sprint(BuildInfo.BuiltBy))
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
