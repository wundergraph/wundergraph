---
title: GraphQl Yoga SSE subscriptions Example
pageTitle: WunderGraph - Examples - GraphQl Yoga SSE subscriptions
description:
---

[Check the example](https://github.com/wundergraph/wundergraph/tree/main/examples/graphql-yoga-sse-subscriptions)

### Configuration

```typescript
const counter = introspect.graphql({
  apiNamespace: 'counter',
  url: 'http://127.0.0.1:4000/graphql',
  subscriptionsUseSSE: true,
})
```

#### Getting started

```shell
npm install && npm start
```

#### Check results

```shell
curl -N http://localhost:9991/app/main/operations/Counter
```

#### SSE output

```shell
 curl -N http://localhost:9991/app/main/operations/Counter\?wg_sse\=true
```
