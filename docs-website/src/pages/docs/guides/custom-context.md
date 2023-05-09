---
title: Using a custom context type
pageTitle: WunderGraph - Custom Context
description: This guide explains how to use a custom context type in your handlers
---

# Using a custom context

When calling handler functions, be it a TypeScript operation or a hook, WunderGraph provides a context
object which allows you to read information like the currently logged in user or the client request. However,
in some circumstances you might also want you store additional data in that context.

To solve this problem, WunderGraph provides support for instantiating a custom context on every handler invocation.
To use it, declare a function that returns your context type and pass it to `createWunderGraphServer()`:

```typescript
// wundergraph.server.ts
import { configureWunderGraphServer } from '@wundergraph/sdk/server';

export class MyContext {
  hello() {
    return 'world';
  }
  greet() {
    console.log(`say hello ${this.hello()}`);
  }
}

export const createContext = async () => {
  return new MyContext();
};

export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {
      Countries: {
        preResolve: async ({ operations, context }) => {
          context.greet(); // Use your context from a hook
        },
      },
    },
    mutations: {},
  },
  context: createContext,
}));
```

Additionally, this context can also be used from TypeScript functions:

```typescript
import { createOperation } from '../../generated/wundergraph.factory';

export default createOperation.query({
  handler: async ({ context }) => {
    return {
      hello: context.hello(), // Use your context from an operation
    };
  },
});
```

Notice that, while this example uses a new instance per handler invocation, it is also possible to share the same
instance across all handlers. For example:

```typescript
export class MyContext {}

const sharedContext = new MyContext();

export const createContext = async () => {
  return sharedContext;
};

export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {
      Countries: {
        preResolve: async ({ operations, context }) => {
          context.greet(); // Use your context from a hook
        },
      },
    },
    mutations: {},
  },
  context: createContext,
}));
```

This way the context can be used with popular dependency injection frameworks like (awilix)[https://github.com/jeffijoe/awilix].

## Reading the current request when instantiating the context

The context generator function can take an optional `WunderGraphServerRequest` argument. This parameter contains information
about e.g. the request being currently served.

```typescript
export const createContext = async (req: WunderGraphServerRequest) => {
  return new MyContext(req.clientRequest);
};
```
