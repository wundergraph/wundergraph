# WunderGraph subscriptions example - SSE

### Protocol

https://github.com/enisdenjo/graphql-sse/blob/master/PROTOCOL.md

### Configuration

```typescript
const schema = `
schema {
  query: Query
  subscription: Subscription
}

type Query {
  hello: String
}

type Subscription {
  greetings: String
}
`;

const greetings = introspect.graphql({
  apiNamespace: 'sse',
  url: 'http://localhost:4000/graphql/stream',
  loadSchemaFromString: schema,
  subscriptionsUseSSE: true,
});
```

#### Getting started

```shell
npm install && npm start
```

#### Check results

```shell
curl -N http://localhost:9991/operations/Sse
```

#### SSE output

```shell
 curl -N 'http://localhost:9991/operations/Sse?wg_sse=true'
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=graphql-sse-subscriptions)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
