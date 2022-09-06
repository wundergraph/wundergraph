package webhookhandler

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"github.com/jensneuse/abstractlogger"
	"github.com/wundergraph/wundergraph/pkg/loadvariable"
	"io/ioutil"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"github.com/wundergraph/wundergraph/types/go/wgpb"
)

func New(config *wgpb.WebhookConfiguration, pathPrefix, hooksServerURL string, log abstractlogger.Logger) (http.Handler, error) {
	u, err := url.Parse(hooksServerURL)
	if err != nil {
		return nil, err
	}
	proxy := httputil.NewSingleHostReverseProxy(u)
	handler := &webhookHandler{
		webhookName: config.Name,
		log:         log,
		proxy:       proxy,
		pathPrefix:  "/" + pathPrefix,
	}
	if config.Verifier != nil {
		switch config.Verifier.GetKind() {
		case wgpb.WebhookVerifierKind_HMAC_SHA256:
			handler.verifier = &sha256HMACVerifier{
				secret:                []byte(loadvariable.String(config.Verifier.Secret)),
				signatureHeader:       config.Verifier.SignatureHeader,
				signatureHeaderPrefix: config.Verifier.SignatureHeaderPrefix,
			}
		}
	}
	return handler, nil
}

type verifier interface {
	Kind() string
	Verify(r *http.Request) bool
}

type webhookHandler struct {
	webhookName string
	log         abstractlogger.Logger
	proxy       *httputil.ReverseProxy
	pathPrefix  string
	verifier    verifier
}

func (h *webhookHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, h.pathPrefix) {
		r.URL.Path = r.URL.Path[len(h.pathPrefix):]
	}
	if r.Body != nil && h.verifier != nil {
		if !h.verifier.Verify(r) {
			h.log.Error("Webhook verification failed",
				abstractlogger.String("webhook", h.webhookName),
				abstractlogger.String("kind", h.verifier.Kind()),
				abstractlogger.String("path", h.pathPrefix+r.URL.Path),
			)
			w.WriteHeader(401)
			return
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

func (v *sha256HMACVerifier) Kind() string {
	return "HMAC_SHA256"
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
