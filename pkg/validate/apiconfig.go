package validate

import (
	"github.com/wundergraph/wundergraph/pkg/apihandler"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
)

// ApiConfig validates the Api
func ApiConfig(api *apihandler.Api) (valid bool, messages []string) {

	if !api.HasCookieAuthEnabled() {
		// skip following tests if cookie auth is not enabled
		// in this case, we don't have to check it
		return true, nil
	}

	csrfSecret := loadvariable.String(api.AuthenticationConfig.CookieBased.CsrfSecret)
	if valid, msg := NewValidator("authentication.cookieBased.csrfTokenSecret", csrfSecret).Validate(Required(), Length(11)); !valid {
		return valid, msg
	}

	blockKey := loadvariable.String(api.AuthenticationConfig.CookieBased.BlockKey)
	if valid, msg := NewValidator("authentication.cookieBased.secureCookieBlockKey", blockKey).Validate(Required(), Length(32)); !valid {
		return valid, msg
	}

	hashKey := loadvariable.String(api.AuthenticationConfig.CookieBased.HashKey)
	if valid, msg := NewValidator("authentication.cookieBased.secureCookieHashKey", hashKey).Validate(Required(), Length(32)); !valid {
		return valid, msg
	}

	return true, nil
}
