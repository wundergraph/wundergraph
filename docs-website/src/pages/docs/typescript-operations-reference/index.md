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

You can create a TypeScript Operation by using the `createOperation` factory function,
which can be imported from the `.wundergraph/generated/wundergraph.factory` file.

Here's a simple example:

```typescript
// .wundergraph/operations/math/add.ts
import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.query({
  input: z.object({
    a: z.number(),
    b: z.number(),
  }),
  handler: async ({ input }) => {
    return {
      add: input.a + input.b,
    };
  },
});
```

Import `createOperation` (the factory function), `z` (the zod schema builder) and `AuthorizationError` (the error class for authorization errors).
Then, make a default export with the result of calling `createOperation.query` or `createOperation.mutation` or `createOperation.subscription`,
depending on what kind of operation you want to create.

Thanks to using zod to define the input schema, we're automatically creating a JSON Schema for input validation and the `input` argument to the handler function is type-safe.

The `wunderctl up` command will automatically pick up the new operation, compile (transpile) the function and add it to the router of your WunderGraph Application.
We've carefully crafted the `.wundergraph/generated/wundergraph.factory` file to be as type-safe as possible and only import the necessary modules from the `@wundergraph/sdk` package to keep the bundle size small.
WunderGraph internally uses `esbuild` to transpile the TypeScript code, so it's reasonably fast.

We can now use curl to call this operation:

```bash
curl http://localhost:9991/operations/math/add?a=1&b=2
```

This will return the following JSON:

```json
{
  "data": {
    "add": 3
  }
}
```
