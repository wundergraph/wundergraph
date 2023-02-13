package validate

import (
	"fmt"
	"github.com/wundergraph/wundergraph/pkg/apihandler"
)

func invalidSecretLengthErrorMessage(secretName string, requiredLength int) string {
	return fmt.Sprintf("the required environment variable %s must have a length of %d", secretName, requiredLength)
}

// ApiConfig validates the Api
func ApiConfig(api *apihandler.Api) (valid bool, messages []string) {
	if !api.HasCookieAuthEnabled() {
		// skip following tests if cookie auth is not enabled
		// in this case, we don't have to check it
		return true, nil
	}

	requiredCsrfLength := 11
	if len(api.CookieBasedSecrets.CsrfSecret) != requiredCsrfLength {
		return false, append(messages, invalidSecretLengthErrorMessage(apihandler.WgEnvCsrfSecret, requiredCsrfLength))
	}

	requiredHashAndBlockLength := 32
	if len(api.CookieBasedSecrets.BlockKey) != requiredHashAndBlockLength {
		return false, append(messages, invalidSecretLengthErrorMessage(apihandler.WgEnvBlockKey, requiredHashAndBlockLength))
	}

	if len(api.CookieBasedSecrets.HashKey) != 32 {
		return false, append(messages, invalidSecretLengthErrorMessage(apihandler.WgEnvHashKey, requiredHashAndBlockLength))
	}

	return true, nil
}
