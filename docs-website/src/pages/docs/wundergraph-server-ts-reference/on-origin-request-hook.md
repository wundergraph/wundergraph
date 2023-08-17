---
title: onOriginRequest hook
description: Reference documentation for the onOriginRequest hook
---

The `onOriginRequest` hook is called whenever the resolver needs to call a remote service.
It can be enabled for all Operations, or for specific ones.
Using this hook, you're able to completely rewrite the request, headers, etc.

This hook is useful, e.g. when you'd like to sign requests or when you have to get a one time short-lived access token.

{% callout title="Setting headers in this hook" %}
In case of openAPI you need to mention the headers that you will dynamically set in this hook within the introspection config.
It can be either in staticHeaders or clientRequestHeaders
{% /callout %}

The `onOriginRequest` hook is called with the following parameters:

- `user`: The user object when the user is authenticated
- `clientRequest`: The original client request object, including Headers
- `log`: The logger object
- `operations`: The operations client, used to call other (internal) operations
- `internalClient`: The internal client object, _deprecated_
- `request`: The HTTP request to be sent to the remote service
- `operation`: The operation (name and type) that triggered the hook.

The hook must return a Promise to one of:

- A `WunderGraphRequest` representing the new request to be sent
- `SKIP` to skip the hook and use the original request
- `CANCEL` to cancel the HTTP request entirely

Additionally, at configuration time it is possible to decide which operations will trigger this hook.
Setting `enableForAllOperations: true` will call the hook in every operation, while setting it to `false`
and specifying individual operation names in `enableForOperations` property allows for more fine grained
control.

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
          enableForAllOperations: true, // Trigger this hook for all operations
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
