---
title: TypeScript Subscription Operations
description: Learn how to create TypeScript Subscription Operations
---

The third type of operation is a subscription. Subscriptions are similar to queries, but instead of returning a single result, they return a stream of results.
Let's create a subscription that returns the user with the given id every second.

```typescript
// .wundergraph/operations/users/subscribe.ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
  input: z.object({
    id: z.string(),
  }),
  handler: async function* ({ input }) {
    // you'd usually do something like this:
    // const user = await db.users.subscribe(input);
    // yield user.next();
    try {
      for (let i = 0; i < 10; i++) {
        yield {
          id: input.id,
          name: 'Jens',
          bio: 'Founder of WunderGraph',
          updatedAt: new Date().toISOString(),
        };
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } finally {
      // user.unsubscribe();
      // the finally block gets called when the user unsubscribes
      // this means you can unsubscribe from the external API here
    }
  },
});
```

What's special about the subscription operation is the `handler` function. It's an async generator function, which means it can yield multiple values.
Instead of using the `return` keyword, you have to use the `yield` keyword to return a value.
You can use `yield` multiple times, and the client will receive a stream of results.

Let's call this operation using curl:

```bash
curl http://localhost:9991/operations/users/subscribe?id=1
```

The result should be:

```json
{
  "data": {
    "id": "1",
    "name": "Jens",
    "bio": "Founder of WunderGraph",
    "updatedAt": "2021-03-15T13:00:00.000Z"
  }
}
```

The result will be streamed to the client. If you want to unsubscribe, you can close the connection.
In curl, you can do this by pressing `Ctrl+C`, and the stream will end.

## Streaming partial results

Another very interesting feature of subscriptions is that you can stream partial results.
Let's say you have a view that requires data from multiple data sources.
You can kick off multiple requests in parallel, and stream the results as they come in.

Here's an example.
Let's say we're building a newsfeed for a user.
Loading the user info is fast, but loading the posts is slow.
We can kick off the requests in parallel, and stream the results as they come in.

```typescript
// .wundergraph/operations/users/newsfeed.ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.subscription({
  input: z.object({
    id: z.string(),
  }),
  handler: async function* ({ input }) {
    const userPromise = Promise.resolve({
      id: input.id,
      name: 'Jens',
      bio: 'Founder of WunderGraph',
      updatedAt: new Date().toISOString(),
    });
    const postsPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: input.id,
            title: 'WunderGraph is awesome',
            content: 'WunderGraph is awesome',
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    // next, await the result of the userPromise and yield it
    yield {
      user: await userPromise,
      posts: [],
    };
    // finally, we wait for the postsPromise and yield the full result
    yield {
      user: await userPromise,
      posts: await postsPromise,
    };
  },
});
```

The result should be:

```json
{
  "data": {
    "user": {
      "id": "1",
      "name": "Jens",
      "bio": "Founder of WunderGraph",
      "updatedAt": "2021-03-15T13:00:00.000Z"
    },
    "posts": []
  }
}
```

After a second, the result will be:

```json
{
  "data": {
    "user": {
      "id": "1",
      "name": "Jens",
      "bio": "Founder of WunderGraph",
      "updatedAt": "2021-03-15T13:00:00.000Z"
    },
    "posts": [
      {
        "id": "1",
        "title": "WunderGraph is awesome",
        "content": "WunderGraph is awesome",
        "updatedAt": "2021-03-15T13:00:00.000Z"
      }
    ]
  }
}
```

Thanks to this architecture, you can easily build great user experiences that show data as soon as it's available,
but without blocking the UI rendering until all data is available.

You can use subscriptions just like queries, but with the additional benefit that you can partially render the results.
