---
title: GraphQL subscriptions hooks Example
pageTitle: WunderGraph - Examples - GraphQL subscriptions hooks
description:
---

[Check the example](https://github.com/wundergraph/wundergraph/tree/main/examples/graphql-subscriptions-hooks)

## Configuration

The best way to understand how to use subscriptions hooks is to play with the configuration.

Let's start with the `wundergraph.config.ts` file, and configure the data source:

```typescript
const counter = introspect.graphql({
  id: 'counter',
  apiNamespace: 'ws',
  loadSchemaFromString: schema,
  url: 'http://localhost:4000/graphql',
});

configureWunderGraphApplication({
  apis: [counter],
});
```

Now let's configure the hooks in the `wundergraph.server.ts` file:

```typescript
// wundergraph.server.ts
export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    global: {
      wsTransport: {
        onConnectionInit: {
          // counter is the id of the introspected api (data source id), defined in the wundergraph.config.ts
          enableForDataSources: ['counter'],
          hook: async (hook) => {
            let token = hook.clientRequest.headers.get('Authorization') || '';
            // we can have a different logic for each data source
            if (hook.dataSourceId === 'counter') {
              token = 'secret';
            }
            return {
              // this payload will be passed to the ws `connection_init` message payload
              // {"type": "connection_init", "payload": {"Authorization": "secret"}}
              payload: {
                Authorization: token,
              },
            };
          },
        },
      },
    },
    queries: {},
    mutations: {},
    subscriptions: {
      // .wundergraph/operations/Ws.graphql
      Ws: {
        mutatingPreResolve: async (hook) => {
          // here we modify the input before request is sent to the data source
          hook.input.from = 7;
          return hook.input;
        },
        postResolve: async (hook) => {
          // here we log the response we got from the ws server (not the modified one)
          hook.log.info(`postResolve hook: ${hook.response.data!.ws_countdown}`);
        },
        mutatingPostResolve: async (hook) => {
          // here we modify the response before it gets sent to the client
          let count = hook.response.data!.ws_countdown!;
          count++;
          hook.response.data!.ws_countdown = count;
          return hook.response;
        },
        preResolve: async (hook) => {
          // here we log the request input
          /**
           * // .wundergraph/operations/Ws.graphql
           * subscription($from: Int!) {
           * 	ws_countdown(from: $from)
           * }
           */
          hook.log.info(`preResolve hook input, counter starts from: ${hook.input.from}`);
        },
      },
    },
  },
  graphqlServers: [],
}));
```

## Getting started

```shell
npm install && npm start
```

## Check results

```shell
curl -N  http://localhost:9991/operations/Ws\?from\=5
```

- Check the output.
- Check the logs to see the hooks being executed.

## Learn more

- [Guides](/docs/guides)
- [WunderGraph Server TS Reference](/docs/wundergraph-server-ts-reference)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="graphql-subscriptions-hooks" /%}
