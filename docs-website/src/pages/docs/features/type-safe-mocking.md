---
title: Type-Safe Mocking
pageTitle: WunderGraph - Features - Type-Safe Mocking
description:
---

When we're looking at the lifecycle of APIs, it's not always the case that an API is fully implemented yet or even available to our current environment.
Another use case might be that we're trying to integrate against an external service but don't want to use their actual API during development.

In all these cases, we'd like to easily add mocks to our API.

Our prime directive is to create the best possible developer experience which means we've also gone the extra mile for mocking.

Thanks to our code generator, we're generating TypeScript stubs for all the Operations you create so that you can create typesafe mocks.

All it takes to add a mock to an API is implement a function.
You can mix mocked and non-mocked APIs.
It's also possible to skip a mock based on conditions.

WunderGraph Mocks are just functions.
You can put any logic you want, use a database, or an in-memory object to create stateful mocks.

Here's an example:

```typescript
// wundergraph.server.ts

const randomInt = (max: number) => Math.floor(Math.random() * Math.floor(max)) + 1;

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    queries: {
      FakeProducts: {
        mockResolve: async () => {
          return {
            data: {
              topProducts: [
                {
                  name: 'foo',
                  price: randomInt(100),
                  upc: 'bar',
                },
                {
                  name: 'foo',
                  price: randomInt(100),
                  upc: 'bar2',
                },
              ],
            },
          };
        },
      },
      OasUsers: {
        mockResolve: async () => {
          return {
            data: {
              getUsers: [
                {
                  name: 'Jens',
                  country_code: 'DE',
                  id: 1,
                },
              ],
            },
          };
        },
      },
    },
    mutations: {},
  },
}));
```

## How to

If you'd like to get more info on how to configure mocks,
have a look at the mockResolve hook reference.
