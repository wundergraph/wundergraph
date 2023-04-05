---
title: TypeScript Operations with Next.js
pageTitle: WunderGraph - Examples - TypeScript Operations
description:
---

[The NextJS TypeScript Operations example](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs-typescript-functions) demonstrates how you can use TypeScript Operations with WunderGraph & Next.js.

Keep in mind that WunderGraph is frontend framework-agnostic,
so you can use it with any frontend framework, not just Next.js.

## Usage

To define your first TypeScript Operation, create a new file in the `operations` directory.

```ts
// operations/users/get.ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
  input: z.object({
    id: z.string(),
  }),
  handler: async ({ input }) => {
    return {
      id: input.id,
      name: 'Jens',
      bio: 'Founder of WunderGraph',
    };
  },
});
```

Now you can use the operation in your NextJS page.

```tsx
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

Types are shared between client and server, that's why we call this isomorphic TypeScript APIs.

If you want to learn more about this feature, how to use it with mutations and subscriptions, have a look at the [reference documentation](/docs/typescript-operations-reference).

## Learn more

- [Guides](/docs/guides)
- [Next.js client documentation](/docs/clients-reference/nextjs)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Next.js frontend to Vercel.

{% deploy template="nextjs-typescript-functions" /%}
