---
title: Mock Resolve Hook
pageTitle: WunderGraph - Mock Resolve Hook
description:
---

The `mockResolve` hook, as the name indicates,
can be used to mock the response of an Operation.
During development, the real server might not be available,
or you don't want to make a real request, e.g. a write operation to a database.

In this case, you can use the `mockResolve` hook to mock the response of an Operation.
The actual resolver will be skipped in this case.

Similar to all other hooks,
the `customResolve` hook is called with the following parameters:

- `user`: The user object when the user is authenticated
- `clientRequest`: The original client request object, including Headers
- `log`: The logger object
- `internalClient`: The internal client object
- `response`: The response object (only for postResolve hooks)
- `input`: The input object (only for Operation hooks)

With the `internalClient`,
you're able to securely call into all defined Operations,
e.g. to talk to a database or another service to enrich a response or manipulate the inputs of an Operation.

```typescript
// wundergraph.server.ts
export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    queries: {
      Dragons: {
        mockResolve: async (hook) => {
          return {
            data: {
              dragons: [
                {
                  name: 'Dragon 1',
                },
              ],
            },
          };
        },
      },
    },
  },
}));
```
