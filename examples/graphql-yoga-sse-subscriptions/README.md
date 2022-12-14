# WunderGraph subscriptions example - SSE with graphql-yoga

### Configuration

```typescript
const counter = introspect.graphql({
  apiNamespace: 'counter',
  url: 'http://localhost:4000/graphql',
  subscriptionsUseSSE: true,
});
```

#### Getting started

```shell
npm install && npm start
```

#### Check results

```shell
curl -N http://localhost:9991/operations/Counter
```

#### SSE output

```shell
 curl -N 'http://localhost:9991/operations/Counter?wg_sse=true'
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
