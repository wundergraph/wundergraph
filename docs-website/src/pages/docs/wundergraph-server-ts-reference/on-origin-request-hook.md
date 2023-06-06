---
title: onOriginRequest hook
description: Reference documentation for the onOriginRequest hook
---

The `onOriginRequest` hook is called whenever the resolver needs to call a remote service.
It can be enabled for all Operations, or for specific ones.
Using this hook, you're able to completely rewrite the request, headers, etc.

This hook is useful, e.g. when you'd like to sign requests or when you have to get a one time short-lived access token.

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
    global: {
      httpTransport: {
        onOriginRequest: {
          enableForAllOperations: true,
          hook: async ({ request }) => {
            request.headers.set('X-Wundergraph-Test', 'test');
            console.log('onOriginRequest', request.headers);
            return request;
          },
        },
      },
    },
  },
}));
```
