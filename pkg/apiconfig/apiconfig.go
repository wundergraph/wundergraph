package apiconfig

import (
	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

func HasCookieAuthEnabled(api *wgpb.Api) bool {
	return api != nil && api.AuthenticationConfig != nil &&
		api.AuthenticationConfig.CookieBased != nil &&
		len(api.AuthenticationConfig.CookieBased.Providers) > 0
}
