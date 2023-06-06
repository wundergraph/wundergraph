---
title: GraphQL Apollo WS subscriptions Example
pageTitle: WunderGraph - Examples - GraphQL Apollo WS subscriptions
description:
---

[Check the example](https://github.com/wundergraph/wundergraph/tree/main/examples/graphql-apollo-subscriptions)

## Getting started

Start the chat server:

```bash
cd chat
go mod download
go run /server/server.go
```

Playground running on: http://localhost:8085

Start wundergraph:

```shell
npm install && npm start
```

## Check results

```shell
curl -N http://localhost:9991/operations/Chat
```

Go to the playground and run the following query:

```graphql
mutation SendMessage {
  post(roomName: "test", username: "me", text: "hello!") {
    id
    text
  }
}
```

## Learn more

- [Apollo Graphql](https://apollographql.com/)
