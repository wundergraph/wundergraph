package authentication

import (
	"crypto/rand"
	"encoding/base64"
	"io"
)

const (
	// AuthorizePath indicates the name for the path component used for authorization handlers
	AuthorizePath = "authorize"
	// CallbackPath indicates the name for the path component used for callback handlers
	CallbackPath = "callback"
)

func generateState() (string, error) {
	b := make([]byte, 16)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
