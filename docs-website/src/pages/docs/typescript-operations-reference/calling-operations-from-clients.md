---
title: Calling TypeScript Operations from Clients
description: How to call TypeScript Operations from clients
---

You might have seen it in the other examples, but we'd like to dedicate an extra section to calling TypeScript Operations from clients because there are a few things to note.

WunderGraph doesn't just let you create TypeScript Operations, but also provides a code generator with various integrations, like Next.js, SWR, and React Query,
that make it super easy to call your TypeScript Operations from your clients.

Moreover, we don't just generate TypeScript code to make calling your Operations type-safe.
The code we generate uses type imports similar to [trpc](https://trpc.io), so types are automatically shared between the client and the server.
This gives you an amazing developer experience because you can easily refactor your code across the client and the server.
Additionally, this architecture makes up for an amazing developer experience because you don't have to wait for a code generation step to finish when making changes.
If you're changing the server-side definition of an Operation, it's immediately reflected in the client-side code.

Here's an example of how to call a TypeScript Operation from a Next.js page using SWR:

```typescript jsx
// pages/users/index.tsx
import { useQuery, withWunderGraph } from '../../components/generated/nextjs';

const Users = () => {
  const { data } = useQuery({
    operationName: 'users/get',
    input: {
      id: '1',
    },
  });
  return (
    <div style={{ color: 'white' }}>
      <div>{data?.id}</div>
      <div>{data?.name}</div>
      <div>{data?.bio}</div>
    </div>
  );
};

export default withWunderGraph(Users);
```

## How do I use my TypeScript Operations using plain HTTP, e.g. using curl

Of course, you can also just use curl to call your TypeScript Operations.

Query:

```bash
curl http://localhost:9991/operations/users/get
```

Mutation:

```bash
curl http://localhost:9991/operations/users/create \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"name": "Jens", "bio": "Founder of WunderGraph"}'
```

Subscription:

```bash
curl http://localhost:9991/operations/users/subscribe
```
