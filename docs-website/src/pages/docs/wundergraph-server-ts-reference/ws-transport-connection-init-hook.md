---
title: On WS Connection Init Hook
pageTitle: WunderGraph - On WS Connection Init Hook
description:
---

The `onConnectionInit` hook is called whenever the resolver needs to call a remote service.
It can be enabled for specific data-sources.
Using this hook, you're able to populate the websocket `connection_init` message payload.

This hook is useful, e.g. when you'd like to authorize the websocket connection through a `connection_init` message payload.

```json
{ "type": "connection_init", "payload": { "Authorization": "Bearer <token>" } }
```

Similar to all other hooks,
the `onConnectionInit` hook is called with the following parameters:

- `user`: The user object when the user is authenticated
- `clientRequest`: The original client request object, including Headers
- `log`: The logger object
- `internalClient`: The internal client object

```typescript
// wundergraph.config.ts
const chat = introspect.graphql({
  id: 'myDataSourceId',
  apiNamespace: 'chat',
  url: 'http://localhost:8085/query',
})

// wundergraph.server.ts
export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    global: {
      wsTransport: {
        onConnectionInit: {
          enableForDataSources: ['myDataSourceId'],
          hook: async ({ request }) => {
            return {
              payload: {
                Authorization: request.headers.get('Authorization'),
              },
            }
          },
        },
      },
    },
  },
}))
```
