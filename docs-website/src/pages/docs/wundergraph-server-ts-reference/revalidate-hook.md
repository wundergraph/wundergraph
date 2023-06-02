---
title: revalidate hook
description: Reference documentation for the revalidate hook
---

The `revalidate` hook is used to "re-authenticate" a user.

Let's say you're storing some useful information,
like org id, in the custom claims of the user object.
You've used the `mutatingPostAuthentication` hook to do this.

Let's say, the user joined another organization.
You might want to add this new org to the custom claims.
In order to do so, you can use the `revalidate` hook.
More info on how to revalidate user can be found in the [WunderGraph RPC Protocol](/docs/architecture/wundergraph-rpc-protocol-explained#cookie-based-authentication).

Similar to all other hooks,
the `customResolve` hook is called with the following parameters:

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
    authentication: {
      revalidate: async (hook) => {
        return {
          user: {
            name: 'John Doe',
          },
          status: 'ok',
        };
      },
    },
  },
}));
```
