---
title: mutatingPreResolve hook
description: Reference documentation for the mutatingPreResolve hook
---

The `mutatingPreResolve` hook is called before the Operation gets resolved.
You're able to modify the input before it gets passed to the resolvers.
Supported operations are `queries`, `mutations` and `subscriptions`.

Similar to all other hooks,
the `mutatingPreResolve` hook is called with the following parameters:

- `user`: The user object when the user is authenticated
- `clientRequest`: The original client request object, including Headers
- `log`: The logger object
- `operations`: The operations client, used to call other (internal) operations
- `input`: The input object (only for Operation hooks)

With the `operations` client,
you're able to securely call into all defined Operations,
e.g. to talk to a database or another service to enrich a response or manipulate the inputs of an Operation.

```typescript
// wundergraph.server.ts
export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {
      Dragons: {
        mutatingPreResolve: async ({ user, clientRequest, log, input, operations }) => {
          return input;
        },
      },
    },
  },
}));
```
