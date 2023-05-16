---
title: Operations client reference
description: How to use the operations client to call other operations.
---

Let's say you'd like to call an operation from a client, but you'd like to add some additional logic before returning the result to the client.
Another use case might be that you've defined a GraphQL Operation, but you'd like to customize the result.

For all those cases, there's a very simple solution: You can call operations from other operations.
We're passing an `operations` object to each handler function, which you can use to call other operations.

Here's a very simple example where we call the `users/get` operation and then rename the results:

```typescript
import { createOperation, z } from '../generated/wundergraph.factory';

export default createOperation.query({
  input: z.object({
    id: z.string(),
  }),
  handler: async ({ input, operations }) => {
    const { data, error } = await operations.query({
      operationName: 'users/get',
      input: {
        id: input.id,
      },
    });
    return {
      userID: data?.id,
      userName: data?.name,
    };
  },
});
```

And that's it. You're free to call any number of operations from within other operations.
Just make sure you're not calling the same operation recursively.
