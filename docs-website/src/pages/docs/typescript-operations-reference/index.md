---
title: TypeScript Operations Reference
pageTitle: WunderGraph - Reference - TypeScript Operations
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

TypeScript Operations come in three different flavors, similar to GraphQL Operations: `Query`, `Mutation`
and `Subscription`.

Here's a typical file structure when using TypeScript Operations:

```text
.wundergraph
├── operations
│   ├── users
│   │   ├── get.ts
│   │   ├── create.ts
│   │   ├── update.ts
│   │   └── subscribe.ts
```

With this API, we're able to get, create, update, delete and subscribe to users.

## Creating TypeScript Read Operations (Query)

Let's define the four operations, starting with the `get` operation:

```typescript
// .wundergraph/operations/users/get.ts
import { createOperation, z } from '../../generated/wundergraph.factory'

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
    }
  },
})
```

## Creating TypeScript Write Operations (Mutation)

Next, let's define the `create` operation:

```typescript
// .wundergraph/operations/users/create.ts
import { createOperation, z } from '../../generated/wundergraph.factory'

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
    }
  },
})
```

Now, let's implement the `update` operation:

```typescript
// .wundergraph/operations/users/update.ts
import { createOperation, z } from '../../generated/wundergraph.factory'

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
    }
  },
})
```

## Creating TypeScript Subscribe Operations

Finally, let's implement the `subscribe` operation:

```typescript
// .wundergraph/operations/users/subscribe.ts
import { createOperation, z } from '../../generated/wundergraph.factory'

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
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } finally {
      // user.unsubscribe();
      // the finally block gets called when the user unsubscribes
      // this means you can unsubscribe from the external API here
    }
  },
})
```

## How do I use TypeScript Operations in my client?

```typescript jsx
// pages/users/index.tsx
import { useQuery, withWunderGraph } from '../../components/generated/nextjs'

const Users = () => {
  const { data } = useQuery({
    operationName: 'users/get',
    input: {
      id: '1',
    },
  })
  return (
    <div style={{ color: 'white' }}>
      <div>{data?.id}</div>
      <div>{data?.name}</div>
      <div>{data?.bio}</div>
    </div>
  )
}

export default withWunderGraph(Users)
```

## How do I use my TypeScript Operations using plain HTTP, e.g. using curl

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
