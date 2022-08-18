package webhookhandler

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

func New(config *wgpb.WebhookConfiguration, pathPrefix, hooksServerURL string) (http.Handler, error) {
	u, err := url.Parse(hooksServerURL)
	if err != nil {
		return nil, err
	}
	proxy := httputil.NewSingleHostReverseProxy(u)
	proxy.Transport = &webhookProxyTransport{
		pathPrefix: "/" + pathPrefix,
	}
	return proxy, nil
}

type webhookProxyTransport struct {
	pathPrefix string
}

func (t *webhookProxyTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	if strings.HasPrefix(req.URL.Path, t.pathPrefix) {
		req.URL.Path = req.URL.Path[len(t.pathPrefix):]
	}
	return http.DefaultTransport.RoundTrip(req)
}
