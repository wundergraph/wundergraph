package apicache

import (
	"context"
	"errors"
	"net/url"
	"path"
	"time"

	"github.com/dgraph-io/ristretto"
	"github.com/go-redis/cache/v8"
	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
)

type Cache interface {
	SetWithTTL(key string, data []byte, ttl time.Duration)
	Set(key string, data []byte)
	Get(ctx context.Context, key string) (CacheItem, bool)
	Delete(ctx context.Context, key string)
}

type CacheItem struct {
	Data       []byte
	InsertUnix int64
}

func (c *CacheItem) Age() int64 {
	return time.Now().Unix() - c.InsertUnix
}

type InMemoryCache struct {
	c *ristretto.Cache
}

func NewInMemory(maxSize int64) (*InMemoryCache, error) {
	inMemoryCache, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: maxSize / 10,
		MaxCost:     maxSize,
		BufferItems: 64,
	})
	if err != nil {
		return nil, err
	}
	return &InMemoryCache{
		c: inMemoryCache,
	}, nil
}

func (i *InMemoryCache) Get(ctx context.Context, key string) (CacheItem, bool) {
	value, hit := i.c.Get(key)
	if hit {
		return value.(CacheItem), true
	}
	return CacheItem{}, false
}

func (i *InMemoryCache) SetWithTTL(key string, data []byte, ttl time.Duration) {
	i.c.SetWithTTL(key, CacheItem{
		Data:       data,
		InsertUnix: time.Now().Unix(),
	}, int64(len(data)), ttl)
}

func (i *InMemoryCache) Set(key string, data []byte) {
	i.c.Set(key, CacheItem{
		Data:       data,
		InsertUnix: time.Now().Unix(),
	}, int64(len(data)))
}

func (i *InMemoryCache) Delete(ctx context.Context, key string) {
	i.c.Del(key)
}

type RedisCache struct {
	c   *cache.Cache
	log *zap.Logger
}

func NewRedis(connectionString string, log *zap.Logger) (*RedisCache, error) {

	u, err := url.Parse(connectionString)
	if err != nil {
		return nil, err
	}

	userName := u.User.Username()
	password, _ := u.User.Password()
	addr := path.Join(u.Host, u.Path)

	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Username: userName,
		Password: password,
	})

	redisCache := cache.New(&cache.Options{
		Redis:        client,
		StatsEnabled: false,
	})

	return &RedisCache{
		c:   redisCache,
		log: log,
	}, nil
}

func (r *RedisCache) SetWithTTL(key string, data []byte, ttl time.Duration) {
	err := r.c.Set(&cache.Item{
		Value: &CacheItem{
			InsertUnix: time.Now().Unix(),
			Data:       data,
		},
		Key:            key,
		TTL:            ttl,
		SkipLocalCache: true,
	})
	if err != nil {
		r.log.Error("RedisCache.SetWithTTL",
			zap.Error(err),
		)
	}
}

func (r *RedisCache) Set(key string, data []byte) {
	err := r.c.Set(&cache.Item{
		Value: &CacheItem{
			InsertUnix: time.Now().Unix(),
			Data:       data,
		},
		Key:            key,
		SkipLocalCache: true,
	})
	if err != nil {
		r.log.Error("RedisCache.Set",
			zap.Error(err),
		)
	}
}

func (r *RedisCache) Get(ctx context.Context, key string) (CacheItem, bool) {
	var item CacheItem
	err := r.c.GetSkippingLocalCache(ctx, key, &item)
	if err != nil {
		if errors.Is(err, cache.ErrCacheMiss) {
			return CacheItem{}, false
		}
		r.log.Error("RedisCache.Get",
			zap.Error(err),
		)
		return CacheItem{}, false
	}
	return item, true
}

func (r *RedisCache) Delete(ctx context.Context, key string) {
	err := r.c.Delete(ctx, key)
	if err != nil {
		r.log.Error("RedisCache.Delete",
			zap.Error(err),
		)
	}
}

type NoOpCache struct{}

func (n *NoOpCache) SetWithTTL(key string, data []byte, ttl time.Duration) {}

func (n *NoOpCache) Set(key string, data []byte) {}

func (n *NoOpCache) Get(ctx context.Context, key string) (CacheItem, bool) {
	return CacheItem{}, false
}

func (n *NoOpCache) Delete(ctx context.Context, key string) {}
