---
title: Configure Authentication
description: How to configure authentication for operations.
---

In this section, we'll configure authentication for our API.
Let's say we'd like to disable authentication by default, but enable it for all `Mutation` Operations.
Here's how we can do that:

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
    mutations: (config) => ({
      ...config,
      authentication: {
        required: true,
      },
    }),
  },
});
```

As in the other examples, we're using the default configuration as a base and add an override function for the `mutations` field.
We'll pipe through all defaults and override the `authentication` field to be required for all `Mutation` Operations.
