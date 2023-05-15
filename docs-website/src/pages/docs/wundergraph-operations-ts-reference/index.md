---
title: wundergraph.operations.ts reference
description: Reference documentation for the wundergraph.operations.ts file.
hideTableOfContents: true
fullWidthContent: true
isIndexFile: true
---

One of the core concepts of WunderGraph is the "Operation".
An Operation is eiter a persisted GraphQL Operation, or a TypeScript Operation,
both available in three flavours: `Query`, `Mutation` and `Subscription`.
Additionally, there's also the `LiveQuery` Operation,
which is a variation of the `Query` Operation using server-side polling.

Configuring TypeScript Operations in a reusable way is quite easy as we're using TypeScript.
In contrast to that, configuring GraphQL Operations is a bit more verbose as GraphQL doesn't offer generics,
making it hard to apply directives to multiple Operations in a repeatable way.

For this reason, we've decided to create a central place to configure default options for all GraphQL Operations,
while still allowing to override them on a per-Operation basis.

Here's an example of how the `wundergraph.operations.ts` file could look like:

```ts
// wundergraph.operations.ts
import { configureWunderGraphOperations } from '@wundergraph/sdk';
import type { OperationsConfiguration } from './generated/wundergraph.operations';

export default configureWunderGraphOperations<OperationsConfiguration>({
  operations: {
    defaultConfig: {
      authentication: {
        required: false,
      },
    },
    queries: (config) => ({
      ...config,
      caching: {
        enable: false,
        staleWhileRevalidate: 60,
        maxAge: 60,
        public: true,
      },
      liveQuery: {
        enable: true,
        pollingIntervalSeconds: 10,
      },
    }),
    mutations: (config) => ({
      ...config,
    }),
    subscriptions: (config) => ({
      ...config,
    }),
    custom: {
      Albums: (config) => ({
        ...config,
        liveQuery: {
          enable: true,
          pollingIntervalSeconds: 1,
        },
      }),
    },
  },
});
```

In the following sections, we'll go through all the available options.
