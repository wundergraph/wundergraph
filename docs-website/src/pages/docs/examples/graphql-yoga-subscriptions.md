---
title: GraphQL Yoga SSE subscriptions Example
pageTitle: WunderGraph - Examples - GraphQL Yoga SSE subscriptions
description:
---

[Check the example](https://github.com/wundergraph/wundergraph/tree/main/examples/graphql-yoga-sse-subscriptions)

## Configuration

```typescript
const counter = introspect.graphql({
  apiNamespace: 'counter',
  url: 'http://localhost:4000/graphql',
  subscriptionsUseSSE: true,
});
```

## Getting started

```shell
npm install && npm start
```

## Check results

```shell
curl -N http://localhost:9991/operations/Counter
```

## SSE output

```shell
 curl -N http://localhost:9991/operations/Counter\?wg_sse\=true
```

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="graphql-yoga-sse-subscriptions" /%}
