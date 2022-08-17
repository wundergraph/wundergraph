package webhookhandler

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io/ioutil"
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
	handler := &webhookHandler{
		proxy:      proxy,
		pathPrefix: "/" + pathPrefix,
	}
	if config.Verifiers != nil {
		for _, verifier := range config.Verifiers {
			switch verifier.GetKind() {
			case wgpb.WebhookVerifierKind_WEBHOOK_VERIFIER_SHA256:
				handler.verifiers = append(handler.verifiers, &sha256HMACVerifier{
					secret:                []byte(verifier.Secret),
					signatureHeader:       verifier.SignatureHeader,
					signatureHeaderPrefix: verifier.SignatureHeaderPrefix,
				})
			}
		}
	}
	return handler, nil
}

type verifier interface {
	Verify(r *http.Request) bool
}

type webhookHandler struct {
	proxy      *httputil.ReverseProxy
	pathPrefix string
	verifiers  []verifier
}

func (h *webhookHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, h.pathPrefix) {
		r.URL.Path = r.URL.Path[len(h.pathPrefix):]
	}
	if r.Body != nil && h.verifiers != nil {
		for _, v := range h.verifiers {
			if !v.Verify(r) {
				return
			}
		}
	}
	h.proxy.ServeHTTP(w, r)
}

type sha256HMACVerifier struct {
	secret                []byte
	signatureHeader       string
	signatureHeaderPrefix string
}

func (v *sha256HMACVerifier) bodySignatureHexString(body []byte) string {
	hash := hmac.New(sha256.New, v.secret)
	_, _ = hash.Write(body)
	return hex.EncodeToString(hash.Sum(nil))
}

func (v *sha256HMACVerifier) bodySignatureBytes(body []byte) []byte {
	hash := hmac.New(sha256.New, v.secret)
	_, _ = hash.Write(body)
	return hash.Sum(nil)
}

func (v *sha256HMACVerifier) Verify(r *http.Request) bool {
	body, err := ioutil.ReadAll(r.Body)
	r.Body = ioutil.NopCloser(bytes.NewReader(body))
	if err != nil {
		return false
	}
	computedSignature := v.bodySignatureBytes(body)
	signature := r.Header.Get(v.signatureHeader)
	if v.signatureHeaderPrefix != "" {
		signature = strings.TrimPrefix(signature, v.signatureHeaderPrefix)
	}
	signatureBytes, _ := hex.DecodeString(signature)
	return hmac.Equal(computedSignature, signatureBytes)
}
