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
  release() {
    console.log('bye');
  }
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
  context: {
    request: {
      create: async () => {
        return new MyContext();
      },
      release: async (ctx) => {
        ctx.release();
      },
    },
  },
}));
```

This will create a per-request context for every request, pass it to every handler and finally call
`context.release`, giving it a chance to free any pending resources.

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
  context: {
    request: {
      create: async () => {
        return new MyCustomContext();
      },
    },
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

## Storing global data

Besides the per-request context, WunderGraph suports a global context too. This context gets instantiated once
when the server starts and can be used when instantiating the per-request contexts:

```typescript
// wundergraph.server.ts

class MyGlobalContext {

}

class MyRequestContext {
    constructor(private ctx: MyGlobalContext)
}


export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {},
    mutations: {},
  },
	context: {
		global: {
			create: async () => {
				return new MyGlobalContext();
			},
			release: async (ctx/*: MyGlobalContext*/) => {
        // Called at server shutdown
			},
		},
		request: {
			create: async (ctx/*: MyGlobalContext*/) => {
				return new MyRequestContext(ctx);
			},
			release: async (ctx/*: MyRequestContext*/) => {
        // Called after every request
			},
		},
	},
});
```

This pattern can be used with popular dependency injection frameworks like [awilix](https://github.com/jeffijoe/awilix).
