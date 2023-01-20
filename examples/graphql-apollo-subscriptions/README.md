# WunderGraph subscriptions example - graphql apollo WS

#### Getting started

Start the chat server:

```bash
cd chat
go mod download
go run server/server.go
```

Playground running on: http://localhost:8085

Start wundergraph:

```shell
npm install && npm start
```

#### Check results

```shell
curl -N http://localhost:9991/operations/Chat
```

#### TS operation

```shell
curl -N http://localhost:9991/operations/users/get?id=1
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

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
