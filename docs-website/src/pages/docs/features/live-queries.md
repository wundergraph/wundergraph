---
title: Live Queries
pageTitle: WunderGraph - Features - Live Queries
description:
---

Not every system is capable of implementing GraphQL Subscriptions.
You might not have the resources to migrate legacy REST or SOAP APIs to GraphQL.
At the same time, you'd like to add some realtime functionality to your applications.

WunderGraph to the rescue, we're able to turn every Query into a Live-Query, with just one piece of configuration.

Take the following Query as an example:

```graphql
query TopProducts {
  topProducts {
    upc
    name
    price
  }
}
```

Using the following configuration, we're enabling Live-Queries for the TopProducts Query.

```typescript
// wundergraph.operations.ts
export default configureWunderGraphOperations<OperationsConfiguration>({
  operations: {
    queries: {
      TopProducts: (config) => ({
        liveQuery: {
          enable: true,
          pollingIntervalSeconds: 2,
        },
      }),
    },
  },
});
```

On the WunderNode we would keep polling the origin every two seconds.
If there's new data, we'd update all clients who subscribed to this live query.
Calling this Live-Query from the clients looks very similar to a regular Query:

```typescript jsx
const IndexPage = () => {
  const response = useQuery({ operationName: 'TopProducts', liveQuery: true });
  return <div>{JSON.stringify(response)}</div>;
};
```

Add `liveQuery: true` and you're done.
The UI will update automatically when the data changes.

## Why Server-Side Polling is amazing

You might be thinking that polling is not reactive, wasteful and stupid.
We think it's brilliant!

Client side polling would indeed be a wasteful operation.
However, with server-side polling, we're able to reduce the number of active "polling" instances up to 1:n.
Meaning, for data that's available to many users,
e.g. multiple users subscribing to the same chat,
we only have to have one single polling instance at a time.

With the potential waste of resources addressed, we'd like to point the real benefit of Live Queries.

You might already know that WunderGraph doesn't just support GraphQL as a DataSource.
Currently, we're also offering REST APIs with more to come.
It doesn't matter which protocol your upstream talks.
Live-Queries are available to all services that are compatible with WunderGraph.

This means you're able to build Realtime Applications using a stateless implementation!

## Serverless GraphQL Subscriptions / Live Queries

As we've explained above, WunderGraph is capable of massively reducing the amount of active polling instances.
Thousands of Live-Queries might be mapped to just a handful of active polling sessions.

With that in mind, you're able to build Realtime Applications using a Serverless architecture.
Serverless, by default, doesn't support Subscriptions.
With WunderGraph, you can build amazing realtime applications without the complexity of handling stateful connections.

Just pick a reasonable polling interval, and we're ready to go.

Throughout this whole section of the docs, we've kept talking about the WunderGraph client.
It's time to take a closer look at it.
