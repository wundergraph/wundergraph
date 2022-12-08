# WunderGraph Functions RFC

WunderGraph is very powerful in integrating databases, external services and APIs, but it's quite limited if you want to run custom logic, for example for transforming some data. You can use server hooks to an extend, but they have their own limitations and are not very flexible.
This RFC introduces a new concept that allows you to write operations as functions.

## Problems

- Operations can only be defined as Graphql, but sometimes you want to write custom logic that is not easily expressible as a Graphql operation.
- It forces you to run separate services for your business logic. This slows you down when building new products.
- Hooks are all defined in one file, which makes it hard to maintain and scale.
- Hooks are not co-located, it's easy to oversee something.
- Easy to make conflicting operations in larger projects, no way to namespace them.
- You always have to define .graphql operations, even for internal use.

## Requirements

- Operations should be defined as Typescript functions.
- Support sub folders (file based routing).
- Queries, mutations can live next to eachother.
- Support RBAC.
- Input validation.
- Support hooks (or similar functionality)
- Allow to override response headers.
- Generate JSON schema for the input types.

## Solution

WunderGraph operations can be defined as Typescript files. These functions are basically resolvers and can potentially be written in any language. This RFC only proposes a Typescript API for now.

The motivation to use functions as operations is that is conceptually very straight forward and we can leverage the existing frontend implementation. It's also a familair pattern when building GraphQL APIs (writing resolvers) and other popular frameworks like tRPC. Making it very easy to migrate to WunderGraph.

### Writing operations

Operations can be defined in the `operation` folder as .ts files along side with the `.graphql` operations.

| Path                         | Operation      |
| ---------------------------- | -------------- |
| `operations/Weather.ts`      | `Weather`      |
| `operations/users/create.ts` | `users/create` |
| `operations/users/list.ts`   | `users/list`   |

The operations can be called in the client like any other operation.

```ts
const client = new WunderGraphClient();
const { data } = await client.query({
  operationName: 'users/list',
});
```

### Operation definition

The operation definition is a function that takes an input and returns a result. The input and result are typesafe based on the operation definition.

### Query

```ts
import { operation } from '../generated/operations'; // this makes sure all internal properties, like context, internalClient, are typesafe without the need to define them manually.

type Input = {
  name: string;
};

export default operation()
  .input((input: Input) => {
    if (!input.name) {
      throw new Error('Name is required');
    }
    return input;
  })
  .query(({ input }) => {
    return {
      name: `Hello ${input.name}!`,
    };
  });
```

### Mutation

```ts
import { operation } from '../generated/operations';

type Input = {
  name: string;
};

export default operation()
  .input((input: Input) => {
    if (!input.name) {
      throw new Error('Name is required');
    }
    return input;
  })
  .mutation(({ input }) => {
    // save to database
    return {
      name: `Hello ${input.name}!`,
    };
  });
```

### Subscription

```ts
import { operation } from '../generated/operations';

type Input = {
  from: number;
};

export default operation()
  .input((input: Input) => {
    if (!input.from) {
      throw new Error('From is required');
    }
    return input;
  })
  .subscription(async function* ({ input }) {
    for (let i = input.from; i >= 0; i--) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      yield { countdown: i };
    }
  });
```

### GraphQL operations

```ts
import { operation } from '../generated/operations';

type Input = {
  city: number;
};

export default operation().input((input: Input) => {
  if (!input.city) {
    throw new Error('City is required');
  }
  return input;
}).graphql(gql`
    query ($city: Int!) {
      Weather(forCity: $city) {
        ...
      }
    }
  `);
```

Based on the return signature of `query()`, `mutation()`, `subscription()`, `graphql()` the operation type is inferred by the WunderNode. Allowing you to have operation types side by side in the same folder.

#### Middleware

Allowing to define middleware for operations is a very powerful concept. It allows you to implement authorization, validation and other logic that is shared across multiple operations. It basically acts as a replacement for hooks.

```ts
import { operation } from '../generated/operations';

// this can be reused across operations.
const authenticatedOperation = operation.use(({ context, next }) => {
  if (!context.user) {
    throw new Error('Unauthorized');
  }

  return next({
    context,
  });
});

export default authenticatedOperation().query(() => {
  return 'This is an authenticated request';
});
```

#### Schema validation

The input method allows to write input validation logic. It's a simple function that throws an error and returns the input if it's valid. The return value is then inferred in the query / mutation parameters, making it typesafe.

You can also use the `zod` library to define the input schema.

```ts
import { operation } from '../generated/operations';

export default operation()
  .input(z.object({ name: z.string() }))
  .query(({ input }) => {
    return {
      name: `Hello ${input.name}!`,
    };
  });
```

#### Validating output

```ts
const schema = z.object({ name: z.string() });
export default operation()
  .input(schema)
  .output(schema)
  .query(({ input }) => {
    return {
      test: `Hello ${input.name}!`, // this will throw, because the output is not valid.
    };
  });
```

#### Access the internal client

```ts
import { operation } from '../generated/operations';

export default operation()
  .input(z.object({ city: z.string() }))
  .query(async ({ input, internalClient }) => {
    const result = await internalClient.Weather({ name: input.city });
    return result;
  });
```

#### RBAC

Adding authorize without any arguments require users to be logged in to execute the operation.

```ts
import { operation } from '../generated/operations';

export default operation()
  .input(z.object({ city: z.string() }))
  .authorize()
  .query(async ({ input, internalClient }) => {
    const result = await internalClient.Weather({ name: input.city });
    return result;
  });
```

It also supports RBAC properties.

```ts
import { operation } from '../generated/operations';

export default operation()
  .input(z.object({ city: z.string() }))
  .authorize({
    requireMatchAll: ['superadmin', 'user'],
  })
  .query(async ({ input, internalClient }) => {
    const result = await internalClient.Weather({ name: input.city });
    return result;
  });
```

## Error handling

TBD

## Modifying request headers

TBD

## Internals

The `operation` factory method is just some sugar coating to fully benefit automatic type inferring and keeping the operation definitions clean and easy to read.
It returns an object similar to the webhooks API.

```ts
type OperationResult = {
  {
    statusCode: number;
    headers: Record<string, string>;
    body: any;
  }
}

type Operation = {
  input: (input: Input) => Input;
  type: 'query' | 'mutation';
  handler: (props: HandlerProps) => OperationResult;
}
```
