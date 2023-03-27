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
import { createOperation, z } from '../generated/wundergraph.factory';

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

Import `createOperation` to create a query, mutation or subscription. `z` is a schema builder from the `zod` package to define your input schema or response schema.
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

## Error Handling

TypeScript Operations can throw errors, which will be handled by the hooks server. The error will be logged and the client will receive an error in the form of:

```json
{
  "errors": [
    {
      "code": "InternalError",
      "message": "Something went wrong"
    }
  ]
}
```

### Custom Error

You can also create custom errors, which will be available to the client in the `code` field of the error. This allows you to have typed errors on the client side, which can be used to handle errors in a more granular way.
Custom errors are defined by extending the `OperationError` class and must be passed to the `errors` field of the handler definition for code-generation. The `statusCode` field is optional and defines the final response status code (defaults to `500`).

```typescript
// .wundergraph/operations/math/divide.ts
import { OperationError } from '@wundergraph/sdk/operations';
import { createOperation, z } from '../generated/wundergraph.factory';

export class DividedByZero extends OperationError {
  statusCode = 400;
  code = 'DividedByZero' as const;
  message = 'Cannot divide by zero';
}

export default createOperation.query({
  errors: [NotFoundErr],
  input: z.object({
    a: z.number(),
    b: z.number(),
  }),
  handler: async ({ input }) => {
    if (input.b === 0) {
      throw new DividedByZero();
    }
    return {
      add: input.a / input.b,
    };
  },
});
```

Now, when we call this operation with `b` being `0`, we'll get the following error:

```json
{
  "errors": [
    {
      "code": "DividedByZero",
      "message": "Cannot divide by zero"
    }
  ]
}
```

#### Handle Errors on the Client

The generated clients are aware of the error codes, so you can handle them in a type-safe way:

```typescript
const { data, error } = await client.query({
  operationName: 'users/get',
});

if (error?.code === 'AuthorizationError') {
  // handle error
} else if (error?.code === 'DividedByZero') {
  // handle error
} else {
  // log unhandled error
  console.error(error);
}
```
