---
title: Configure Defaults
description: How to configure default options for all operations.
---

The `defaultConfig` field is mandatory and allows you to configure the default options for all Operations.
In this example, we're disabling authentication for all Operations,
setting our API to be public by default.

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
  },
});
```
