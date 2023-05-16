---
title: Configure Caching
description: How to configure caching for operations.
---

The `queries` field is also mandatory and allows you to configure the default options for all `Query` Operations.
The field takes a function as an argument, allowing us to "carry over" the default configuration and only override the fields we want to change.

In this example, we're overriding the default caching configuration.
We set `enable` to `false` to disable caching for all `Query` Operations.
Additionally, we're setting the `staleWhileRevalidate` and `maxAge` to `60` seconds and `public` to `true`.

This means that caching is disabled for all Queries,
but if we're enabling it for a specific Query,
the `public`, `staleWhileRevalidate` and `maxAge` options will be set to the values we've configured here.
This approach allows us to configure meaningful defaults,
while being able to enable caching only for specific Queries.

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
      },
    }),
  },
});
```
