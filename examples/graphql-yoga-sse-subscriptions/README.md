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

#### TS operation

```shell
curl -N http://localhost:9991/operations/users/get?id=1
```

## Test the API

1. (Optional) Copy the `.env.example` file to `.env.test` and fill in the required values.
2. Run the following command:

```shell
npm run test
```

## Learn More

Read the [Docs](https://wundergraph.com/docs).

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=graphql-yoga-subscriptions)

## Got Questions?

Join us on [Discord](https://wundergraph.com/discord)!
