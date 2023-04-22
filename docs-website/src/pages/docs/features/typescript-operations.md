---
title: TypeScript Operations
pageTitle: WunderGraph - Features - TypeScript Operations
description: TypeScript Operations allow you to extend your WunderGraph API with custom business logic
---

By default, you have to add data sources to your WunderGraph Application using the introspection APIs,
which will then allow you to query these using GraphQL.

However, sometimes you want to build something fully custom,
or you want to wrap the functionality of an existing API with custom logic.
This is what TypeScript Operations are for.

## What are TypeScript Operations?

TypeScript Operations behave exactly like GraphQL Operations,
except they don't call into the WunderGraph GraphQL Engine,
but instead call into your custom TypeScript code.

TypeScript Operations are also defined in the `.wundergraph/operations` directory,
and they share the same features as GraphQL Operations,
like you can configure authentication, authorization, caching,
input validation, etc...

TypeScript Operations can also be called exactly the same way as GraphQL Operations.
They are being added to the router of your WunderGraph Application,
and you can call them from your generated clients the same way as you would call a GraphQL Operation.

## How do I use TypeScript Operations?

TypeScript Operations come in three different flavors, similar to GraphQL Operations: `Query`, `Mutation` and `Subscription`.

Here is an example of a TypeScript Query:

```typescript
// .wundergraph/operations/users/get.ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
  // by specifying the input schema, we're automatically creating a JSON Schema for input validation
  input: z.object({
    id: z.string(),
  }),
  handler: async ({ input }) => {
    // here you can do whatever you want, like calling an external API, a database, or other operations via the internalClient
    return {
      id: input.id,
      name: 'Jens',
      bio: 'Founder of WunderGraph',
    };
  },
});
```

You can then call this operation from your generated clients:

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

## Isomorphic TypeScript Operations: End-to-End type-safe APIs between Client and Server

What's special about TypeScript Operations is that the API implementation is isomorphic.
Both client and server share the exact same TypeScript code to implement and consume the API.
What this allows you to do is create not just a fully type-safe API between client and server,
but much more importantly, you get an immediate feedback loop when changing client or server code.

{% video src="/videos/isomorphic_typescript_apis_1080_web.mp4" /%}

As you can see in the animation above, when you change the TypeScript Operation on the server,
the client will immediately pick up the changes and show any errors if the contract changed,
all without any code generation or restarting the server.
