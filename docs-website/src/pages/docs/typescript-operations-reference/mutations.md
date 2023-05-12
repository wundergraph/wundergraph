---
title: TypeScript Mutation Operations
description: Learn how to create TypeScript Mutation Operations
---

In this part, we'll create two mutations, `create` and `update`, that will create and update users in our database.

Let's start with the `create` operation:

```typescript
// .wundergraph/operations/users/create.ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.mutation({
  input: z.object({
    name: z.string(),
    bio: z.string(),
  }),
  handler: async ({ input }) => {
    // you'd usually do something like this:
    // const user = await db.users.create(input);
    // return user;
    return {
      id: '1',
      name: input.name,
      bio: input.bio,
    };
  },
});
```

Similarly to the `get` operation, we're using the `createOperation.mutation` function to create a mutation operation.

Let's call this operation using curl:

```bash
curl -X POST http://localhost:9991/operations/users/create -d '{"name": "Jens", "bio": "Founder of WunderGraph"}'
```

The result should be:

```json
{
  "data": {
    "id": "1",
    "name": "Jens",
    "bio": "Founder of WunderGraph"
  }
}
```

Next, let's implement the `update` operation:

```typescript
// .wundergraph/operations/users/update.ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.mutation({
  input: z.object({
    id: z.string(),
    name: z.string(),
    bio: z.string(),
  }),
  handler: async ({ input }) => {
    // you'd usually do something like this:
    // const user = await db.users.update(input);
    // return user;
    return {
      id: input.id,
      name: input.name,
      bio: input.bio,
    };
  },
});
```

Let's call this operation using curl:

```bash
curl -X POST http://localhost:9991/operations/users/update -d '{"id": "1", "name": "Jens", "bio": "Developer"}'
```

The result should be:

```json
{
  "data": {
    "id": "1",
    "name": "Jens",
    "bio": "Developer"
  }
}
```
