---
title: Configure Caching
description: How to configure caching for operations.
---

The `queries` field is optional and allows you to configure the default options for all `Query` Operations.
The field takes a function as an argument, allowing us to "carry over" the default configuration and only override the fields we want to change.

In this example, we're overriding the default caching configuration.
We set `enable` to `false` to disable the cache headers for all `Query` Operations.
Additionally, we're setting `staleWhileRevalidate` and `maxAge` to `60` seconds, enabling
`mustRevalidate` and setting `public` to `true`.

Notice that any request that includes authentication will always mark its response as non-publicly
cacheable by using `private` instead of `public` in `Cache-Control`.

This means that caching is disabled for all Queries,
but if we're enabling it for a specific Query,
the `public`, `staleWhileRevalidate`, `maxAge` and `mustRevalidate` options will be set to the
values we've configured here.
This approach allows us to configure meaningful defaults,
while being able to enable caching only for specific Queries.

If no caching is configured, the default options will omit a `Cache-Control` header with the
`public, max-age=0, must-revalidate` value.

```ts
// wundergraph.operations.ts
import { configureWunderGraphOperations } from '@wundergraph/sdk';
import type { OperationsConfiguration } from './generated/wundergraph.operations';

export default configureWunderGraphOperations<OperationsConfiguration>({
  operations: {
    queries: (config) => ({
      ...config,
      caching: {
        enable: false,
        staleWhileRevalidate: 60,
        maxAge: 60,
        public: true,
        mustRevalidate: false,
      },
    }),
  },
});
```
