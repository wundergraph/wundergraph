---
title: HTTP Layer Caching
description: Caching GraphQL Operations on the HTTP Layer
---

As described in another chapter, WunderGraph compiles GraphQL Operations into
efficient JSON RPC endpoints.
This is not just good for security and performance reasons but also allows for efficient Caching.

By turning Queries into GET Requests, instead of sending GraphQL Operations over HTTP POST,
you can use your favourite CDN, a Varnish, nginx Proxy and even the Browser Cache,
to efficiently Cache the result of an Operation.

Caching can be configured on a global level as well as on a per Operation level.
WunderGraph additionally supports stale while revalidate,
allowing for a good tradeoff between freshness and quickly responding to requests.

Here's an example configuration:

```typescript
export default configureWunderGraphOperations<OperationsConfiguration>({
  operations: {
    queries: (config) => {
      return {
        ...config,
        kind: 'query',
        caching: {
          enable: false,
          public: true,
          maxAge: 10,
          staleWhileRevalidate: 5,
        },
        liveQuery: {
          enable: false,
          pollingIntervalSeconds: 5,
        },
      };
    },
    custom: {
      Countries: enableCaching,
      TopProducts: (config) => ({
        ...config,
        caching: {
          ...config.caching,
          enable: true,
        },
      }),
      Users: (config) => ({
        ...config,
        caching: {
          ...config.caching,
          enable: true,
          maxAge: 120,
        },
      }),
    },
  },
});
```

By default, caching is disabled for all Queries (enable: false), but we set a few other defaults.
Caching should be public (public: true), so cached objects are the same for all users.
MaxAge is set to 10 (seconds), that is, we're caching for 10 seconds.
Stale while revalidate is set to 5 (seconds), so we allow an additional 5 seconds where stale data is acceptable but the
cache should revalidate in the background.

Then, in the custom section, you can see some overrides where we configure individual Operations to be cached or not.
E.g. the Users Operation should be cached for 120 seconds.

Thats it! Write a GraphQL Query, configure caching, ship your application.
You might be thinking, how we revalidate cached content.
That's covered in one of the next sections once we've talked about JSON-RPC.
