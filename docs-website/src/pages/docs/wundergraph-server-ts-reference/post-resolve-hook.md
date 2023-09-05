---
title: postResolve hook
description: Reference documentation for the postResolve hook
---

The `postResolve` hook is called after the response of an Operation has been resolved.
Contrary to the `mutatingPostResolve` hook,
it's not possible to manipulate the response with this hook.
Supported operations are `queries`, `mutations` and `subscriptions`.

The purpose of this hook is e.g. logging.

Similar to all other hooks,
the `postResolve` hook is called with the following parameters:

- `user`: The user object when the user is authenticated
- `clientRequest`: The original client request object, including Headers
- `log`: The logger object
- `operations`: The operations client, used to call other (internal) operations
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
        postResolve: async ({ input, user, log, clientRequest, response }) => {
          log.info(`Resolved Dragons with input: ${input.name}`);
        },
      },
    },
  },
}));
```
