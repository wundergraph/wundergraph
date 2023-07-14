// Package licensing implements WunderGraph license management functions
package licensing

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/google/uuid"
	"github.com/hyperboloide/lk"
	"github.com/jxskiss/base62"
	"github.com/wundergraph/wundergraph/pkg/config"
	"github.com/wundergraph/wundergraph/pkg/features"
)

const (
	trialMessageInterval = 5 * time.Minute
)

var (
	// ErrNoPublicKey indicates no public key is available to validate licenses
	ErrNoPublicKey = errors.New("public key for license signature is not available")
	// ErrNoLicenseFound is returned when trying to load a stored license and no data is found
	ErrNoLicenseFound = errors.New("no license found")
	// ErrLicenseExpired is returned from Manager.Check() when the stored license is expired
	ErrLicenseExpired = errors.New("license is expired")
)

// ErrInvalidLicense signals that the underlying error was caused by an invalid license key
type ErrInvalidLicense struct {
	Err error
}

func (e *ErrInvalidLicense) Error() string {
	return fmt.Sprintf("invalid license: %s", e.Err)
}

func (e *ErrInvalidLicense) Unwrap() error {
	return e.Err
}

const (
	licenseFilename = "license.txt"
)

// License represents decoded license data
type License struct {
	// ID is the unique license ID
	ID uuid.UUID `json:"u"`
	// Email used to register the license
	Email string `json:"e"`
	// ExpiresAt is the license expiration date
	ExpiresAt time.Time `json:"exp"`
}

// IsExpired returns true iff the license expiration is in the past
func (lic *License) IsExpired() bool {
	return lic.ExpiresAt.Before(time.Now())
}

// Print writes a human-readable description of the license to the given io.Writer
func (lic *License) Print(w io.Writer) (int, error) {
	expired := ""
	if lic.IsExpired() {
		expired = "\t (EXPIRED)"
	}
	return fmt.Fprintf(w, "Email:\t\t%s\nExpires:\t%s%s", lic.Email, lic.ExpiresAt, expired)
}

// Manager stores and loads license from the system. To initialize
// a Manager, call NewManager()
type Manager struct {
	publicKey string
	// configDir holds the path to the global WG configuration
	// directory, we override it for tests
	configDir string
}

// NewManager initializes a new Manager with the given public key
func NewManager(publicKey string) *Manager {
	return &Manager{
		publicKey: publicKey,
		configDir: config.ConfigDir(),
	}
}

func (m *Manager) licensePath() string {
	return filepath.Join(m.configDir, licenseFilename)
}

func (m *Manager) decodeLicenseKey(licenseKey string) (*License, error) {
	if m.publicKey == "" {
		return nil, ErrNoPublicKey
	}
	license, err := m.decodeLicense(licenseKey)
	if err != nil {
		return nil, &ErrInvalidLicense{Err: err}
	}
	return license, nil
}

func (m *Manager) decodeLicense(licenseKey string) (*License, error) {
	publicKeyBytes, err := base62.DecodeString(m.publicKey)
	if err != nil {
		return nil, fmt.Errorf("invalid public key string: %w", err)
	}
	publicKey, err := lk.PublicKeyFromBytes(publicKeyBytes)
	if err != nil {
		return nil, fmt.Errorf("invalid public key: %w", err)
	}

	licenseData, err := base62.DecodeString(licenseKey)
	if err != nil {
		return nil, fmt.Errorf("invalid license key string: %w", err)
	}
	license, err := lk.LicenseFromBytes(licenseData)
	if err != nil {
		return nil, fmt.Errorf("invalid license: %w", err)
	}
	ok, err := license.Verify(publicKey)
	if err != nil {
		return nil, fmt.Errorf("verifying license: %w", err)
	}

	if !ok {
		return nil, errors.New("license is not valid")
	}

	var ll License
	if err := json.Unmarshal(license.Data, &ll); err != nil {
		return nil, fmt.Errorf("decoding license: %w", err)
	}
	return &ll, nil
}

// Write validates the given licenseKey and writes it to disk. If the license is
// invalid or if the data can't be written it returns an error. If there's already
// a license stored, it gets overwritten.
func (m *Manager) Write(licenseKey string) (*License, error) {
	license, err := m.decodeLicenseKey(licenseKey)
	if err != nil {
		return nil, err
	}
	if err := os.WriteFile(m.licensePath(), []byte(licenseKey), 0666); err != nil {
		return nil, err
	}
	return license, nil
}

// Read reads the stored license, if any. If no license is found, it returns ErrNoLicenseFound.
// If the license is invalid, the error type will be ErrInvalidLicense. Note that no expiration
// checks are performed by Read().
func (m *Manager) Read() (*License, error) {
	licensePath := m.licensePath()
	data, err := os.ReadFile(licensePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrNoLicenseFound
		}
		return nil, err
	}
	license, err := m.decodeLicenseKey(string(data))
	if err != nil {
		return nil, err
	}
	return license, nil
}

// Remove removes an existing license from the store. If there's no license stored, it returns
// an error.
func (m *Manager) Remove() error {
	if err := os.Remove(m.licensePath()); err != nil {
		if os.IsNotExist(err) {
			return ErrNoLicenseFound
		}
		return err
	}
	return nil
}

// Validate reads the stored license using Manager.Read() and checks whether it's expired. If the
// license is not found, not valid or expired it returns an error. Otherwise, it returns nil.
func (m *Manager) Validate() error {
	license, err := m.Read()
	if err != nil {
		return err
	}
	if license.IsExpired() {
		return ErrLicenseExpired
	}
	return nil
}

func (m *Manager) FeatureCheck(wunderGraphDir string, w io.Writer) error {
	verr := m.Validate()
	if verr == nil {
		// We have a license, stop here
		return nil
	}
	var enterpriseFeaturesNames []string
	for {
		feats, err := features.EnabledFeatures(wunderGraphDir)
		if err != nil {
			if os.IsNotExist(err) {
				time.Sleep(100 * time.Millisecond)
				continue
			}
			return err
		}
		for _, feat := range feats {
			if features.IsEnterprise(feat) {
				enterpriseFeaturesNames = append(enterpriseFeaturesNames, string(feat))
			}
		}
		break
	}
	if len(enterpriseFeaturesNames) > 0 {
		go func() {
			warnFprintf := color.New(color.FgYellow).FprintfFunc()
			boldWarnFprintf := color.New(color.FgYellow, color.Bold).FprintfFunc()
			boldFprintf := color.New(color.FgGreen, color.Bold).FprintfFunc()

			for {
				warnFprintf(w, "The following features require a WunderGraph Enterprise License: %s\n", strings.Join(enterpriseFeaturesNames, ", "))
				warnFprintf(w, "Since no license has been found, trial mode has been enabled\n")
				boldWarnFprintf(w, "TRIAL MODE IS NOT ALLOWED FOR PRODUCTION USE\n")
				boldFprintf(w, "See https://wundergraph.com to purchase a WunderGraph Enterprise License\n")
				time.Sleep(trialMessageInterval)
			}
		}()
	}
	return nil
}
