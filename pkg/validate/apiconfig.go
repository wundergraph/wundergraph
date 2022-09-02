package validate

import (
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

// ApiConfig validates the Api
func ApiConfig(api *wgpb.Api) (valid bool, messages []string) {
	// if providers slice is empty, cookie based auth is disabled
	if api != nil &&
		api.AuthenticationConfig != nil &&
		api.AuthenticationConfig.CookieBased != nil &&
		len(api.AuthenticationConfig.CookieBased.Providers) > 0 {

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

	}

	return true, nil
}
