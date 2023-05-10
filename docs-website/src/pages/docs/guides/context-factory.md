---
title: Extend the WunderGraph server context
pageTitle: WunderGraph - Extend the WunderGraph server context
description: This guide explains how to use a custom context type in your handlers
---

# Using the context factory

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

export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {
      Countries: {
        preResolve: async ({ operations, context }) => {
          // Use your context from a hook
          context.greet();
        },
      },
    },
    mutations: {},
  },
  createContext: async (ctx) => {
    return new MyContext();
  },
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

As well as from webhooks:

```typescript
import type { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';
import { createWebhook } from '../generated/wundergraph.webhooks';

export default createWebhook<WebhookHttpEvent, WebhookHttpResponse>({
  handler: async (event, context) => {
    return {
      statusCode: 200,
      headers: {
        myResponseHeaderVar: 'test',
      },
      body: {
        myResponseBodyVar: `hello ${context.context.hello()}`,
      },
    };
  },
});
```

And embedded GraphQL servers:

```typescript
export default configureWunderGraphServer(() => ({
  /* ... */
  createContext: async (): Promise<MyCustomContext> => {
    return new MyCustomContext();
  },
  graphqlServers: [
    {
      apiNamespace: 'embedded',
      serverName: 'embedded',
      schema: new GraphQLSchema({
        query: new GraphQLObjectType<any, GraphQLExecutionContext<MyCustomContext>>({
          name: 'Query',
          fields: {
            fromCustomContext: {
              type: GraphQLString,
              resolve: async (parent, args, ctx) => {
                return ctx.wundergraph.context.hello();
              },
            },
          },
        }),
      }),
    },
  ],
}));
```

Notice that, while this example uses a new instance per handler invocation, it is also possible to share the same
instance across all handlers. For example:

```typescript
export class MyContext {}

const sharedContext = new MyContext();

export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {},
    mutations: {},
  },
  createContext: async () => {
    return sharedContext;
  },
}));
```

This way the context can be used with popular dependency injection frameworks like [awilix](https://github.com/jeffijoe/awilix).

## Using additional information when instantiating the context

The context generator function can take an optional `ctx` argument. This parameter contains information
about e.g. the request being currently served as well as references to the current user, the logger and
the internal operations client.
