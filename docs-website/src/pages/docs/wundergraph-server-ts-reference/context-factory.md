---
title: Context Factory
pageTitle: WunderGraph - Context Factory
description:
---

When configuring your WunderGraph server `createContext` allows you ro provide a factory function
to instantiate a custom context type for every incoming request:

```typescript
// wundergraph.server.ts
import { configureWunderGraphServer, createContext } from '@wundergraph/sdk/server';

export class MyContext {
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
  createContext: createContext(async (req) => {
    return new MyContext();
  }),
}));
```

This will make your custom context available in operations, hooks, webhooks and embedded GraphQL servers. For more information, see the [Context Factory guide](/docs/guides/context-factory).
