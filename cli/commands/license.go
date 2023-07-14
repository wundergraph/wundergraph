package commands

import (
	"errors"
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/wundergraph/wundergraph/pkg/licensing"
)

var (
	// Overridden at build time
	licensingPublicKey = ""
)

// licenseCmd represents the command for managing WunderGraph licenses
var licenseCmd = &cobra.Command{
	Use:   "license",
	Short: "Manages WunderGraph licenses",
}

var licenseInstallCmd = &cobra.Command{
	Use:   "install <license-key>",
	Short: "Installs a WunderGraph license",
	RunE: func(cmd *cobra.Command, args []string) error {
		if len(args) < 1 {
			return errors.New("license key argument is required")
		}
		licenseKey := args[0]
		m := licensing.NewManager(licensingPublicKey)
		if _, err := m.Write(licenseKey); err != nil {
			return fmt.Errorf("error installing license: %s", err)
		}
		return nil
	},
}

var licenseRemoveCmd = &cobra.Command{
	Use:   "remove",
	Short: "Removes the installed WunderGraph license",
	RunE: func(cmd *cobra.Command, args []string) error {
		m := licensing.NewManager(licensingPublicKey)
		if err := m.Remove(); err != nil {
			return fmt.Errorf("could not remove license: %w", err)
		}
		return nil
	},
}

var licenseShowCmd = &cobra.Command{
	Use:   "show",
	Short: "Shows the installed WunderGraph license",
	RunE: func(cmd *cobra.Command, args []string) error {
		m := licensing.NewManager(licensingPublicKey)
		license, err := m.Read()
		if err != nil {
			return fmt.Errorf("could not show license: %w", err)
		}
		out := os.Stdout
		if _, err := license.Print(out); err != nil {
			return err
		}
		_, err = fmt.Fprint(out, "\n")
		return err
	},
}

func init() {
	licenseCmd.AddCommand(licenseInstallCmd)
	licenseCmd.AddCommand(licenseRemoveCmd)
	licenseCmd.AddCommand(licenseShowCmd)

	rootCmd.AddCommand(licenseCmd)
}
