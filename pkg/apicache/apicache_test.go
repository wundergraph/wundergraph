//go:build integration
// +build integration

package apicache

import (
	"context"
	"testing"
	"time"

	"github.com/jensneuse/abstractlogger"
	"github.com/stretchr/testify/assert"
)

func TestInMemoryCache(t *testing.T) {
	cache, err := NewInMemory(1e4 * 50)
	assert.NoError(t, err)

	cache.SetWithTTL("foo", []byte("bar"), time.Millisecond*10)
	time.Sleep(time.Millisecond)
	bar, hit := cache.Get(nil, "foo")
	assert.Equal(t, true, hit)
	assert.Equal(t, "bar", string(bar.Data))
	time.Sleep(time.Millisecond * 10)
	bar, hit = cache.Get(nil, "foo")
	assert.Equal(t, false, hit)
}

func TestRedisCache(t *testing.T) {

	cache, err := NewRedis("0.0.0.0:55001", abstractlogger.NoopLogger)
	assert.NoError(t, err)

	cache.SetWithTTL("foo", []byte("bar"), time.Second)
	time.Sleep(time.Millisecond * 500)
	bar, hit := cache.Get(context.Background(), "foo")
	assert.Equal(t, true, hit)
	assert.Equal(t, "bar", string(bar.Data))
	time.Sleep(time.Millisecond * 500)
	bar, hit = cache.Get(context.Background(), "foo")
	assert.Equal(t, false, hit)
}
