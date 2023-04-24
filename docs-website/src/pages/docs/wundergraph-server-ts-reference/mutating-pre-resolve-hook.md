---
title: Mutating Pre Resolve Hook
pageTitle: WunderGraph - Mutating Pre Resolve Hook
description:
---

The `mutatingPreResolve` hook is called before the Operation gets resolved.
You're able to modify the input before it gets passed to the resolvers.
Supported operations are `queries`, `mutations` and `subscriptions`.

Similar to all other hooks,
the `mutatingPreResolve` hook is called with the following parameters:

- `user`: The user object when the user is authenticated
- `clientRequest`: The original client request object, including Headers
- `log`: The logger object
- `internalClient`: The internal client object
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
        mutatingPreResolve: async ({ user, clientRequest, log, input, internalClient }) => {
          return input;
        },
      },
    },
  },
}));
```
