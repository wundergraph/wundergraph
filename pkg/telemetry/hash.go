package telemetry

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"strings"
)

// Hash hashes a telemetry value to anonymize it. Always use
// this function to ensure the hashing algorithm stays consistent
func Hash(value string) (string, error) {
	hash := sha256.New()
	if _, err := io.Copy(hash, strings.NewReader(value)); err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)), nil
}
