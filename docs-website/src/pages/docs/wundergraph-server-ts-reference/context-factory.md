---
title: Context Factory
pageTitle: WunderGraph - Context Factory
description:
---

When configuring your WunderGraph server `context` allows you ro provide functions
to instantiate and release custom contexts for every incoming request:

```typescript
// wundergraph.server.ts
import { configureWunderGraphServer } from '@wundergraph/sdk/server';

class GlobalContext {}

class RequestContext {
  constructor(private ctx: GlobalContext) {}
  hello() {
    return 'world';
  }
  greet() {
    console.log(`say hello ${this.hello()}`);
  }
}

export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {},
    mutations: {},
  },
  context: {
    global: {
      create: async () => {
        return new GlobalContext();
      },
      release: async (ctx) => {},
    },
    request: {
      create: async (ctx) => {
        return new RequestContext(ctx);
      },
      release: async (ctx) => {},
    },
  },
}));
```

This will make your custom context available in operations, hooks, webhooks and embedded GraphQL servers. For more information, see the [Context Factory guide](/docs/guides/context-factory).
