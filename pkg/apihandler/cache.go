package apihandler

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/cespare/xxhash"
	"github.com/wundergraph/wundergraph/pkg/apicache"
	"github.com/wundergraph/wundergraph/pkg/wgpb"
)

type cacheConfig struct {
	Enable               bool
	MaxAge               int64
	Public               bool
	StaleWhileRevalidate int64
}

// cacheHandler holds the cache configuration and data structures for an operation handler.
// To create a cacheHandler, use newCacheHandler()
type cacheHandler struct {
	config cacheConfig
	cache  apicache.Cache
	// configHash is the hash of the full application configuration. We use it as part
	// of the cache keys to ensure any changes to the config invalidate the cache
	configHash []byte
}

// newCacheHandler returns a new cacheHandler from an apicache.Cache, an wgpb.OperationCacheConfig representing
// the cache configuration for an operation and the API configuration hash (typically from Api.ApiConfigHash)
func newCacheHandler(cache apicache.Cache, config *wgpb.OperationCacheConfig, configHash string) *cacheHandler {
	return &cacheHandler{
		config: cacheConfig{
			Enable:               config.Enable,
			MaxAge:               config.MaxAge,
			Public:               config.Public,
			StaleWhileRevalidate: config.StaleWhileRevalidate,
		},
		cache:      cache,
		configHash: []byte(configHash),
	}
}

// RequestHandler returns a handler for a single operation request, deriving the key from the
// cacheHandler's configHash and the request URI. The requestCacheHandler will be enabled or
// disabled based on the cacheHandler's config. A disabled requestCacheHandler will not append
// Cache-Control/Age headers, will never lookup items in its cache and won't store them either.
//
// See also requestCacheHandler.
func (c *cacheHandler) RequestHandler(r *http.Request, w http.ResponseWriter) *requestCacheHandler {
	return &requestCacheHandler{
		handler: c,
		r:       r,
		w:       w,
		key:     string(c.configHash) + r.RequestURI,
	}
}

// requestCacheHandler holds the cache related data for a given API requests. You should create
// a requestCacheHandler early in the request, try to serve cached data via Serve and, if that fails,
// regenerate the data and call SetHeaders() to provide the appropriate headers followed by
// Store() to store the data.
//
// requestCacheHandler methods are all nil-safe, in the sense that calling them with a nil receiver
// will result in a no-op. This voids moving some checks from the handlers into requestCacheHandler's
// method, making the operation handling logic more straightforward.
type requestCacheHandler struct {
	handler *cacheHandler
	r       *http.Request
	w       http.ResponseWriter
	key     string
	isStale bool
}

func (c *requestCacheHandler) isEnabled() bool {
	return c != nil && c.handler.config.Enable
}

// ETag returns a en ETag derived from the config hash and the received data
func (c *requestCacheHandler) ETag(data []byte) string {
	hash := xxhash.New()
	_, _ = hash.Write(c.handler.configHash)
	_, _ = hash.Write(data)
	return fmt.Sprintf("W/\"%d\"", hash.Sum64())
}

// SetETag generates an ETag via ETag(), then sets it as the ETag header and
// returns the ETag value.
func (c *requestCacheHandler) SetETag(data []byte) string {
	etag := c.ETag(data)
	c.w.Header()["ETag"] = []string{etag}
	return etag
}

// SetHeaders adds Cache-Control and Age headers to the response using Header().Set() in the
// requestCacheHandler' http.ResponseWriter iff the cache is enabled. Otherwise it's a no-op.
func (c *requestCacheHandler) SetHeaders(age int64) {
	if !c.isEnabled() {
		return
	}
	config := &c.handler.config

	publicOrPrivate := "private"
	if config.Public {
		publicOrPrivate = "public"
	}
	c.w.Header().Set("Cache-Control", fmt.Sprintf("%s, max-age=%d, stale-while-revalidate=%d", publicOrPrivate, config.MaxAge, config.StaleWhileRevalidate))
	c.w.Header().Set("Age", fmt.Sprintf("%d", age))
}

// Serve tries to serve the requestCacheHandler's http.Request from the cache,
// return true iff the request was entirely served and no further data should
// be written. If there's no cache hit, it adds the X-Wg-Cache: MISS header
// and returns false. If the cache is disabled, this is a no-op.
func (c *requestCacheHandler) Serve(ctx context.Context) (bool, error) {
	if !c.isEnabled() {
		return false, nil
	}
	item, hit := c.handler.cache.Get(ctx, c.key)
	if hit {

		c.w.Header().Set(WgCacheHeader, "HIT")

		etag := c.SetETag(item.Data)
		age := item.Age()
		c.SetHeaders(item.Age())
		c.isStale = age > c.handler.config.MaxAge

		ifNoneMatch := c.r.Header.Get("If-None-Match")
		if ifNoneMatch == etag {
			c.w.WriteHeader(http.StatusNotModified)
			return true, nil
		}

		c.w.WriteHeader(http.StatusOK)
		if _, err := c.w.Write(item.Data); err != nil {
			return true, err
		}
		return true, nil
	} else {
		c.w.Header().Set(WgCacheHeader, "MISS")
	}
	return false, nil
}

// Store stores the given data under the cache key used for this handler, using the
// TTL as determined by the configuration. If the cache is disabled, this is a no-op.
func (c *requestCacheHandler) Store(data []byte) {
	if !c.isEnabled() {
		return
	}
	cacheData := make([]byte, len(data))
	copy(cacheData, data)

	config := &c.handler.config
	ttl := time.Second * time.Duration(config.MaxAge+config.StaleWhileRevalidate)
	c.handler.cache.SetWithTTL(c.key, cacheData, ttl)
}

// IfStale should be called after the whole request has been served. If the request
// was served from the cache is now stale, it calls the received generator() function
// to regenerate the cache and refresh the cache (using Store()). See also (OnStale())
func (c *requestCacheHandler) IfStale(generator func() ([]byte, error)) error {
	if !c.isEnabled() || !c.isStale {
		return nil
	}
	data, err := generator()
	if err != nil {
		return err
	}
	c.Store(data)
	return nil
}
