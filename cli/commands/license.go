package commands

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/pkg/browser"
	"github.com/spf13/cobra"
	"github.com/wundergraph/wundergraph/pkg/licensing"
)

var (
	// Overridden at build time
	LicensingPublicKey = "GgFgWHflzJJ82PPExCx4ZiVaz0f2btWSl8R3UGn65LU6OIeL4l5z4ZC0qxOIygSxCXgQQXH0UcGgBhv7d8DGpPkcJcvmt96W0eKcqWtv3BW1TrKAPKCfRwcfvmjoSHOwFEA"
)

func startLicenseHTTPServer(licenseCh chan<- string) (string, error) {
	const licenseHandlerPath = "/license/"
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		return "", fmt.Errorf("could not listen on a TCP port: %w", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc(licenseHandlerPath, func(w http.ResponseWriter, r *http.Request) {
		licenseKey := strings.TrimPrefix(r.URL.Path, licenseHandlerPath)
		licenseCh <- licenseKey
		redirect := r.URL.Query().Get("redirect")
		if redirect != "" {
			http.Redirect(w, r, redirect, http.StatusFound)
		} else {
			w.WriteHeader(http.StatusOK)
		}
	})
	server := &http.Server{
		Handler: mux,
	}

	go server.Serve(listener)
	return "http://" + listener.Addr().String() + licenseHandlerPath, nil
}

// licenseCmd represents the command for managing WunderGraph licenses
var licenseCmd = &cobra.Command{
	Use:   "license",
	Short: "Manages WunderGraph licenses",
}

var licenseTrialCmd = &cobra.Command{
	Use:   "trial",
	Short: "Generates a trial enterprise WunderGraph license",
	RunE: func(cmd *cobra.Command, args []string) error {
		// Start an http server in localhost to wait for the token
		const licenseFormURL = "https://cloud.wundergraph.com/license"
		licenseCh := make(chan string, 1)
		localLicenseURL, err := startLicenseHTTPServer(licenseCh)
		if err != nil {
			fmt.Printf("could not start automatic license generation: %s\n", err)
			fmt.Printf("open %s in your browser, generate a license and use %s license install to install it", licenseFormURL, os.Args[0])
			return nil
		}
		toOpen := fmt.Sprintf("%s?local_url=%s", licenseFormURL, url.QueryEscape(localLicenseURL))
		if err := browser.OpenURL(toOpen); err != nil {
			fmt.Printf("could not automatically open your browser: %s\n", err)
			fmt.Printf("open %s and generate your license", toOpen)
		} else {
			fmt.Println("generate your license using your browser and then come back to this window")
		}
		licenseKey := <-licenseCh
		m := licensing.NewManager(LicensingPublicKey)
		license, err := m.Write(licenseKey)
		if err != nil {
			return fmt.Errorf("error installing license: %s", err)
		}
		out := os.Stdout
		if _, err := fmt.Fprint(out, "installed license\n"); err != nil {
			return err
		}
		if _, err := license.Print(out); err != nil {
			return err
		}
		_, err = fmt.Fprint(out, "\n")
		return err
	},
}

var licenseInstallCmd = &cobra.Command{
	Use:   "install <license-key>",
	Short: "Installs a WunderGraph license",
	RunE: func(cmd *cobra.Command, args []string) error {
		if len(args) < 1 {
			return errors.New("license key argument is required")
		}
		licenseKey := args[0]
		m := licensing.NewManager(LicensingPublicKey)
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
		m := licensing.NewManager(LicensingPublicKey)
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
		m := licensing.NewManager(LicensingPublicKey)
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
	licenseCmd.AddCommand(licenseTrialCmd)
	licenseCmd.AddCommand(licenseInstallCmd)
	licenseCmd.AddCommand(licenseRemoveCmd)
	licenseCmd.AddCommand(licenseShowCmd)

	rootCmd.AddCommand(licenseCmd)
}
