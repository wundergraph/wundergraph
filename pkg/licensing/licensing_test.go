package licensing

import (
	"errors"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

const (
	testPublicKey = "GgFgWHflzJJ82PPExCx4ZiVaz0f2btWSl8R3UGn65LU6OIeL4l5z4ZC0qxOIygSxCXgQQXH0UcGgBhv7d8DGpPkcJcvmt96W0eKcqWtv3BW1TrKAPKCfRwcfvmjoSHOwFEA"
	// Matching private key (not used, kept for reference)
	// AkSF1XYQagW4jYJeBLKjWo4rA5WRD5tlIXXvUNH0mjqB67RPPLbJobwwae7uAhwrUrAxEgBYBo1xvcOJh3ezDRsQMeMxKtZ6v9WrlUJfobKjT98FKdHEfF8y8Z8MBa1YHEZQpYhLQIorDaKODwgw39OeDGpPkcJcvmt96W0eKcqWtv3BW1TrKAPKCfRwcfvmjoSHOwFEEWACefZefAAAAGefCEQBDefKAAAAQ4fDgoACAAFCQs6gagAEIAAE8fBIXZulWY052bDtGcLEQADE4fRB

	testExpiredLicense = "AAEO8xyV5bEU3jzweYfRsw80pXBQzks271rxrHVgP45GVDP5aQfSCeNc3YR1a8f0yFFImAywiPqpBdiMBUyofoURwdeoWPgiKhodaSb2kfXF7SXSYJc90lnYdLYITFLdHmhLrJmAxEQfExmZ0BGYa5GcgBnYyxlakRHbgRHYihKckplcgplco5mYERHRgDvyEhFRa7txcBN4CTuzkrMycru7A6N6krMxYLMR0RkyEhFREDHbwxmwC7mwqxGYahGyKDnWKTmaoplawxGaaJMzMLmymZmZERHRqTk9mLABfv3fHAAAwwfLQAFM4fVAAAAgwfHwUBEAAEefBIVABAgCBEGdhREBBMQAAI4fDos5crsxSjpDCIgBC8fsA"
	testValidLicense   = "AgEjsKDXOYe3M10xoatmCvHLRibOpe4HRoakSYR0I975D9GiZ9efB80eyTCol7ebOsLQMBMiqXHJK6cbCfYzMpaoI7jrys5e4YfbbAKkNeY7NZoLrV8ilrZ60VbycamuwsDSJowCETA9JCMwoTMwsiM0gDOzMjL3QjOyQjOxEDV4ITL0ATL3kjMyIiOiAHeKTEWEpt3GzF0gLM5OTuyIzt6uDo3oTuyEjtwERHRKTEWExMbkBmxqZsbyZMbwpFzwBHcaBHzshmWMbGZmpFyIzmaCDGxkREdEpOR2buAE8feefBAAAM8fCEQBDefKAAAAQ4fDYqACAACffAkKgAAQhACjuwIigAGIAAE8fBU2cuV2Ypx0BBEwABefsA"
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

func TestValidID(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "")
	assert.NoError(t, err)
	defer os.RemoveAll(tmpDir)
	_, license := writeLicense(t, tmpDir, testValidLicense)
	assert.NotEqual(t, "00000000-0000-0000-0000-000000000000", license.ID.String())
}
