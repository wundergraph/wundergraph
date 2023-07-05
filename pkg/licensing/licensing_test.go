package licensing

import (
	"errors"
	"fmt"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

const (
	testPublicKey = "GgFgWHflzJJ82PPExCx4ZiVaz0f2btWSl8R3UGn65LU6OIeL4l5z4ZC0qxOIygSxCXgQQXH0UcGgBhv7d8DGpPkcJcvmt96W0eKcqWtv3BW1TrKAPKCfRwcfvmjoSHOwFEA"
	// Matching private key (not used, kept for reference)
	// AkSF1XYQagW4jYJeBLKjWo4rA5WRD5tlIXXvUNH0mjqB67RPPLbJobwwae7uAhwrUrAxEgBYBo1xvcOJh3ezDRsQMeMxKtZ6v9WrlUJfobKjT98FKdHEfF8y8Z8MBa1YHEZQpYhLQIorDaKODwgw39OeDGpPkcJcvmt96W0eKcqWtv3BW1TrKAPKCfRwcfvmjoSHOwFEEWACefZefAAAAGefCEQBDefKAAAAQ4fDgoACAAFCQs6gagAEIAAE8fBIXZulWY052bDtGcLEQADE4fRB

	testExpiredLicense = "A0S3hiT51bPaUOtO16SLQRhMeaU0FHaVhj0jMU9EG9A0ic8q1wThcpfaPNkC7s0hwgAxEgf9uGJ9TPZJaZzZWGhRgjR5PFbtZBCPggZRz74X9Q31plDiKebKzBTIZ91HMJ7qnpCETAAAAABUXCp14bAAHeKLBAa7txcBN4CTuzkrMycru7A6N6krMxYLMAAAAMAoMBAAAAiJmAE8fcefAAAAGefCEQBDefKAAAAQ4fDYqACAACffAkKgAAQhACjuwIigAGIAAE8fBU2cuV2Ypx0BBEwABefsA"
	testValidLicense   = "AEkqUsLre3QAuJXRHfjooNPNSEDyQlnw17rffCSHeCQzyYapCJGx5hnzKgtiLr6Ym3FImAu2F9bYMlZvWyInEYhTWf2ZSLPfiQC54mCluIQKXn9nU80xfC6uiq7DjBU1yTf6yrIBiJAAAAgEI7ZSzDJAgDvySAg2e2YugGchJ3ZyVGZuV3dA9GdyVmYsFGAAAAGAUmAAAAAxETACefcefAAAAGefCEQBDefKAAAAQ4fDYqACAACffAkKgAAQhACjuwIigAGIAAE8fBU2cuV2Ypx0BBEwABefsA"
	testEmail          = "alberto@wundergraph.com"
)

func writeLicense(t *testing.T, tmpDir string, licenseKey string) (*Manager, *License) {
	m := NewManager(testPublicKey)
	m.configDir = tmpDir

	license, err := m.Write(licenseKey)
	assert.NoError(t, err)

	assert.Equal(t, testEmail, license.Email)
	return m, license
}

func TestWrite(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)
	writeLicense(t, tmpDir, testExpiredLicense)
}

func TestNoPublicKey(t *testing.T) {
	m := NewManager("")
	license, err := m.Write(testExpiredLicense)
	assert.Equal(t, ErrNoPublicKey, err)
	assert.Nil(t, license)
}

func TestWriteInvalid(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)
	m := NewManager(testPublicKey)
	m.configDir = tmpDir

	license, err := m.Write("invalid license")
	var licenseError *ErrInvalidLicense
	assert.True(t, errors.As(err, &licenseError))
	assert.Nil(t, license)
}

func TestRead(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)
	manager, license := writeLicense(t, tmpDir, testExpiredLicense)
	license2, err := manager.Read()
	assert.NoError(t, err)
	assert.Equal(t, license, license2)
}

func TestExpiration(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)
	_, expired := writeLicense(t, tmpDir, testExpiredLicense)
	assert.True(t, expired.IsExpired())
	_, notExpired := writeLicense(t, tmpDir, testValidLicense)
	fmt.Println(expired.ExpiresAt)
	fmt.Println(notExpired.ExpiresAt)
	assert.False(t, notExpired.IsExpired())
}

func TestRemove(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)
	manager, _ := writeLicense(t, tmpDir, testExpiredLicense)
	_, err = manager.Read()
	assert.NoError(t, err)
	err = manager.Remove()
	assert.NoError(t, err)
	_, err = manager.Read()
	assert.Equal(t, err, ErrNoLicenseFound)
}
