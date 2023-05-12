---
title: Configure Live Queries
description: How to configure Live Queries.
---

Another essential feature of WunderGraph is Live Queries.
In contrast to Subscriptions, Live Queries use server side polling to create a stream of updates.
This allows you to turn any API into a real-time API without having to implement a WebSocket server,
so your server can be stateless and scale horizontally.

```ts
// wundergraph.operations.ts
import { configureWunderGraphOperations } from '@wundergraph/sdk';
import type { OperationsConfiguration } from './generated/wundergraph.operations';

export default configureWunderGraphOperations<OperationsConfiguration>({
  operations: {
    queries: (config) => ({
      ...config,
      liveQuery: {
        enable: true,
        pollingIntervalSeconds: 1,
      },
    }),
  },
});
```

In this example, we're enabling Live Queries for all Operations by default and setting the polling interval to `1` second.
This means that all Queries will be polled every second and the client will receive updates if the data has changed.
On the server-side, we're hashing the result of the last poll and compare it to the current result,
so we're only sending updates if the data has changed.

When configuring the polling interval, you should consider the following:

- The polling interval should be as short as possible, but not shorter than the time it takes to execute the query
- A shorter polling interval will increase the load on the database and the server
- A longer polling interval will increase the latency of the updates

So, the right polling interval is a trade-off between latency and load on the server.
If data is changing very infrequently, your users will not notice a longer polling interval.

In some scenarios, the ideal polling interval might be different for different Queries.
You will learn in the next section how to configure Live Queries on a per-Query basis.
