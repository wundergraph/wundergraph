---
title: On Origin Response Hook
pageTitle: WunderGraph - On Origin Response Hook
description:
---

The `onOriginResponse` hook is called whenever the resolver process gets a response from a remote service.
It can be enabled for all Operations, or for specific ones.

This hook is useful, e.g. when you'd like to rewrite a response before it gets passed back to the resolver engine.
You could for example remove personally identifiable information from the response.

Similar to all other hooks,
the `customResolve` hook is called with the following parameters:

- `user`: The user object when the user is authenticated
- `clientRequest`: The original client request object, including Headers
- `log`: The logger object
- `operations`: The operations client, used to call other (internal) operations
- `internalClient`: The internal client object, _deprecated_
- `response`: The response object (only for postResolve hooks)
- `input`: The input object (only for Operation hooks)

With the `internalClient`,
you're able to securely call into all defined Operations,
e.g. to talk to a database or another service to enrich a response or manipulate the inputs of an Operation.

```typescript
// wundergraph.server.ts
export default configureWunderGraphServer(() => ({
  hooks: {
    global: {
      httpTransport: {
        onOriginResponse: {
          enableForAllOperations: true,
          hook: async ({ response }) => {
            console.log('onOriginResponse', response.headers);
            return 'skip';
          },
        },
      },
    },
  },
}));
```
