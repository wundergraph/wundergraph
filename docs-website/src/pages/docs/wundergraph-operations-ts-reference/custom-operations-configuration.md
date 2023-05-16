---
title: Custom Operations Configuration
description: How to override configuration for specific operations.
---

Finally, let's take a look at how we can add custom overrides on a per-Operation basis.

## Add a custom caching configuration

This example sets reasonable defaults for caching, but disables caching by default.
Additionally, we're enabling caching for the `Albums` Query.

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
    custom: {
      Albums: (config) => ({
        ...config,
        caching: {
          ...config.caching,
          enable: true,
        },
      }),
    },
  },
});
```

## Add a custom live query configuration

In this example, we're enabling live queries and setting the polling interval to 10 seconds by default.
On the `Albums` Query, we're overriding the default polling interval to 1 second.

```ts
// wundergraph.operations.ts
import { configureWunderGraphOperations } from '@wundergraph/sdk';
import type { OperationsConfiguration } from './generated/wundergraph.operations';

export default configureWunderGraphOperations<OperationsConfiguration>({
  operations: {
    queries: (config) => ({
      ...config,
      liveQuery: {
        enable: true,
        pollingIntervalSeconds: 10,
      },
    }),
    custom: {
      Albums: (config) => ({
        ...config,
        liveQuery: {
          ...config.liveQuery,
          pollingIntervalSeconds: 1,
        },
      }),
    },
  },
});
```
