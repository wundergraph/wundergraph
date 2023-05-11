# WunderGraph subscriptions example - graphql-ws

### Protocol

https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md

#### Getting started

```shell
npm install && npm start
```

#### Check results

```shell
curl -N http://localhost:9991/operations/Ws
```

#### SSE output

```shell
 curl -N http://localhost:9991/operations/Ws\?wg_sse\=true
```

#### TS operation

```shell
curl -N http://localhost:9991/operations/users/get?id=1
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=graphql-ws-subscriptions)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
