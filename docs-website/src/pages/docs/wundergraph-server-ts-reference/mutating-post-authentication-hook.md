---
title: mutatingPostAuthentication hook
description: Reference documentation for the mutatingPostAuthentication hook
---

The `mutatingPostAuthentication` hook can be used to allow or deny the user to be authenticated,
and to modify the user object, allowing also to set the session duration.

After the authentication flow with a configured authentication provider, e.g. GitHub or Keycloak, is finished,
the `mutatingPostAuthentication` hook is called.

You can return the status `ok`,
which will allow the user to complete the authentication flow.
If you don't want to complete the flow,
you have to return `deny`.

In case of `ok`,
you also need to return the user object,
which can also be modified.
You could modify existing properties,
add custom claims or attributes.

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
      mutatingPostAuthentication: async ({ user }) => {
        return {
          user: {
            name: 'John Doe',
            expires: Date.now() + 10 * 60 * 1000, // Make the session last 10 minutes
          },
          status: 'ok',
        };
      },
    },
  },
}));
```
