---
title: TypeScript Query Operations
description: Learn how to implement Query Operations using TypeScript
---

In this section, we'll learn how to implement a Query Operation using TypeScript.
We'll create a `get` operation that returns a user by its ID.

Import the `createOperation` function and the `z` object from the `wundergraph.factory` module.
It's important that the result of `createOperation` is exported as the default export of the file.

The route of the operation is derived from the file path.
In this case, the file is located at `.wundergraph/operations/users/get.ts`,
so the route of the operation is `/operations/users/get`.

```typescript
// .wundergraph/operations/users/get.ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
  // by specifying the input schema, we're automatically creating a JSON Schema for input validation
  input: z.object({
    id: z.string(),
  }),
  handler: async ({ input }) => {
    // here you can do whatever you want, like calling an external API, a database, or other operations via the operations client
    return {
      id: input.id,
      name: 'Jens',
      bio: 'Founder of WunderGraph',
    };
  },
});
```

Let's call this operation using curl:

```bash
curl http://localhost:9991/operations/users/get?id=1
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
