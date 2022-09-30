---
title: GraphQl WS subscriptions Example
pageTitle: WunderGraph - Examples - GraphQl WS subscriptions
description:
---

[Check the example](https://github.com/wundergraph/wundergraph/tree/main/examples/graphql-ws-subscriptions)

## Protocol

https://github.com/enisdenjo/graphql-ws/blob/master/PROTOCOL.md

## Getting started

```shell
npm install && npm start
```

## Check results

```shell
curl -N http://localhost:9991/app/main/operations/Ws
```

## SSE output

```shell
 curl -N http://localhost:9991/app/main/operations/Ws\?wg_sse\=true
```
