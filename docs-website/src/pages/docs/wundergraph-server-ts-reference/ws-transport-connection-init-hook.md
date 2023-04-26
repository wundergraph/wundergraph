---
title: On WS Connection Init Hook
pageTitle: WunderGraph - On WS Connection Init Hook
description:
---

The `onConnectionInit` hook is called when the engine is initiating a WebSocket connection with a GraphQL Server.
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
- `operations`: The operations client, used to call other (internal) operations
- `internalClient`: The internal client object, _deprecated_
- `datasourceId`: The id of the data-source

```typescript
// wundergraph.config.ts
const chat = introspect.graphql({
  id: 'chatId',
  apiNamespace: 'chat',
  url: 'http://localhost:8085/query',
});

// wundergraph.server.ts
export default configureWunderGraphServer(() => ({
  hooks: {
    global: {
      wsTransport: {
        onConnectionInit: {
          enableForDataSources: ['chatId'],
          hook: async ({ clientRequest, dataSourceId }) => {
            let token = clientRequest.headers.get('Authorization') || '';
            if (dataSourceId === 'chatId') {
              token = 'secret';
            }
            return {
              payload: {
                Authorization: token,
              },
            };
          },
        },
      },
    },
  },
}));
```
