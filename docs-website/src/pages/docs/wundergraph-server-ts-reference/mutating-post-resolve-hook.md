---
title: mutatingPostResolve hook
description: Reference documentation for the mutatingPostResolve hook
---

The `mutatingPostResolve` hook is called after the response of an Operation has been resolved.
You're able to modify the response before it gets sent to the client.
Supported operations are `queries`, `mutations` and `subscriptions`.

Similar to all other hooks,
the `mutatingPostResolve` hook is called with the following parameters:

- `user`: The user object when the user is authenticated
- `clientRequest`: The original client request object, including Headers
- `log`: The logger object
- `operations`: The operations client, used to call other (internal) operations
- `internalClient`: The internal client object, _deprecated_
- `response`: The response object (only for postResolve hooks)
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
        mutatingPostResolve: async ({ user, clientRequest, log, response, operations, internalClient }) => {
          return response;
        },
      },
    },
  },
}));
```
