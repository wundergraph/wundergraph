# WunderGraph Services

This proposal includes a syntax for declaring service dependencies in WunderGraph applications, which
might will only represent internal services. Network protocols used by these services are considered an
implementation detail (e.g. FileStorage might use S3, cache might use memcache, etc... - but user should
not rely on this)

All services are identified by their unique `id`, which allows using them in a handler function with
a very concise syntax. For this reason, `id` values must be valid TS identifiers. (e.g. `post-images` would
be invalid and raise an error).

```typescript
export default createOperation.query({
  input: z.object({
    userId: z.number(),
  }),
  handler: async ({ services, input }) => {
    // Use the 'images' service, strongly typed to FileStorage
    const profilePicUrl = services.images.getPublicUrl(`avatar-${input.userId}`);
    return {
      url: profilePicUrl,
    };
  },
});
```

Additional, a service might take another service as a parameter. For example, a dynamic image resizing service
could take a FileStorage as a parameter. Depencies should be defined as typed parameters (avoiding references by `id`),
so any potential type errors can be caught at compile time.

## FileStorage

FileStorage represents a bucket that stores files. This would mostly follow S3's architecture (left as an
exercise for the reader)

```typescript
const fileStorage = services.FileStorage({
 id: 'images',
 uploadProfiles: {
    profilePic: {
        meta: z.object({userId: z.number()}),
        ...
    },
    ...
 },
});
```

## Key-Value store

A key-value store offers an interface with key-data pairs with optional metadata. Keys are strings while data
values are represented by `string | ArrayBuffer`. Metadata consists of a JSON object that be optionally validated
against a schema.

```typescript
const keyValue = services.KeyValue({
    id: 'user_emails`
    metadata: z.object({
        validated: z.boolean(),
        updated: z.date(),
    })
});
```

A key-value store provides `put(key, data, metadata?)`, `putMultiple(keys, data, metadata?)`, `get(key)`,
`getMultiple(keys)`, `delete(key)` and `deleteMultiple(keys)` without any notion of TTLs. Keep in mind that
a key can contain empty data but non-empty metadata, functioning as typed object storage.

## Cache

A cache represents an in-memory cache which allows storing key-data pairs with an optional TTL. Data in a cache
is ephermeral and could disappear at any time.

```typescript
const cache = services.Cache({
  id: 'cache',
  defaultTtl: 5 * 60,
  maximumSizeBytes: 128 * 1024 * 1024,
});
```

Cache service offers `put(key, data, ttl?)`, `putMultiple(keys, data, ttls?)`, `get(key)`,
`getMultiple(keys)`, `delete(key)` and `deleteMultiple(keys)`. If TTL is not provided, the data is kept around
as long as possible or until it's manually deleted.

# Object Cache

An object cache is just a cache with an schema which caches objects instead of raw data.

```typescript
const objectCache = services.ObjectCache({
  id: 'friend-ids',
  cache: cache, // Declare as services.Cache()
  schema: z.object({
    userId: z.number(),
    friends: z.number().array(),
  }),
});
```

Object cache provides the same API as a bare cache.

## Images

An image server that does dynamic image resizing/optimization.

```typescript
const images = services.Images({
  id: 'imageServer',
  storage: fileStorage, // Previously declared as services.FileStorage
});
```

## Configuring app services

All services are passed to `configureWunderGraphApplication()` as a new field called `services`:

```typescript
import { services, configureWunderGraphApplication, introspect } from '@wundergraph/sdk';

const jsp = introspect.openApi();

const images = services.FileStorage({...});
const videos = services.FileStorage({...});

const cache = services.Cache({...});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
 apis: [jsp],
 services: [images, videos, cache],
});
```

## Deprecations

Introducing this API would deprecate the current S3 providers API. Moving forward, plugging arbitrary S3 storage backends
would not be supported.
