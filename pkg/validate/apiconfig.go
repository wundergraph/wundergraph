package validate

import (
	"fmt"

	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
)

func invalidSecretLengthErrorMessage(secretName string, requiredLength int) string {
	return fmt.Sprintf("the required environment variable %s must have a length of %d", secretName, requiredLength)
}

// ApiConfig validates the Api
func ApiConfig(api *apihandler.Api) (bool, []string) {
	if !api.HasCookieAuthEnabled() {
		// skip following tests if cookie auth is not enabled
		// in this case, we don't have to check it
		return true, nil
	}

	requiredCsrfLength := 11
	csrfSecret := loadvariable.String(api.AuthenticationConfig.CookieBased.CsrfSecret)
	if csrfSecret != "" {
		if valid, message := NewValidator("authentication.cookieBased.csrfTokenSecret", csrfSecret).Validate(Required(), Length(requiredCsrfLength)); !valid {
			return valid, message
		}
	} else if len(api.CookieBasedSecrets.CsrfSecret) != requiredCsrfLength {
		return false, []string{invalidSecretLengthErrorMessage(apihandler.WgEnvCsrfSecret, requiredCsrfLength)}
	}

	requiredHashAndBlockLength := 32
	blockKey := loadvariable.String(api.AuthenticationConfig.CookieBased.BlockKey)
	if blockKey != "" {
		if valid, message := NewValidator("authentication.cookieBased.secureCookieBlockKey", blockKey).Validate(Required(), Length(requiredHashAndBlockLength)); !valid {
			return valid, message
		}
	} else if len(api.CookieBasedSecrets.BlockKey) != requiredHashAndBlockLength {
		return false, []string{invalidSecretLengthErrorMessage(apihandler.WgEnvBlockKey, requiredHashAndBlockLength)}
	}

	hashKey := loadvariable.String(api.AuthenticationConfig.CookieBased.HashKey)
	if hashKey != "" {
		if valid, message := NewValidator("authentication.cookieBased.secureCookieHashKey", hashKey).Validate(Required(), Length(requiredHashAndBlockLength)); !valid {
			return valid, message
		}
	} else if len(api.CookieBasedSecrets.HashKey) != 32 {
		return false, []string{invalidSecretLengthErrorMessage(apihandler.WgEnvHashKey, requiredHashAndBlockLength)}
	}

	return true, nil
}
