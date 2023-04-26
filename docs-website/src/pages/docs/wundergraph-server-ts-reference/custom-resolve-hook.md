---
title: Custom Resolve Hook
pageTitle: WunderGraph - Custom Resolve Hook
description:
---

The `customResolve` hook allows you to override the default resolve behavior of WunderGraph.
If you're not defining this hook,
the WunderGraph execution engine will use the default resolve behavior.
This means, it will call into one or more origins,
fetch data from them and return the result.

With a `customResolve` hook,
this behavior can be overridden.

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
export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    queries: {
      Dragons: {
        customResolve: async ({ user, clientRequest, log, input, operations, internalClient }) => {
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
