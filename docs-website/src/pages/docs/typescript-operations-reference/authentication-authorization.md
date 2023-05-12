---
title: Authenticating and Authorizing TypeScript Operations
description: Learn how to authenticate and authorize users in TypeScript Operations.
---

Here's an overview of the different ways to authenticate and authorize users in WunderGraph.
WunderGraph supports both cookie-based and token-based authentication,
which can be configured in the `wundergraph.config.ts` file.

When defining TypeScript Operations, there are various options to control how authentication and authorization is handled.

## Simple Authentication

The easiest way to enable authentication is to set the `requireAuthentication` option to `true`.
This will configure the WunderGraph Gateway to verify that the user is authenticated,
and if not, it will return a `401 Unauthorized` error.

In this case, the request will never hit the TypeScript Operation handler.

```typescript
// .wundergraph/operations/math/add.ts
import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.query({
  input: z.object({
    a: z.number(),
    b: z.number(),
  }),
  requireAuthentication: true,
  handler: async ({ input, user }) => {
    return {
      add: input.a + input.b,
    };
  },
});
```

## Role-Based Access Control

The second option is to use Role-Based Access Control (RBAC).
You can define a list of roles in the `wundergraph.config.ts` file,
and then use the `rbac` option to specify which roles are required to access the operation.

In this case, we require that the user has the `admin` role.

```typescript
// .wundergraph/operations/math/add.ts
import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.query({
  input: z.object({
    a: z.number(),
    b: z.number(),
  }),
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ['admin'],
  },
  handler: async ({ input, user }) => {
    return {
      add: input.a + input.b,
    };
  },
});
```

## Custom Authorization

If you need more control over the authorization process,
you can implement your own authorization logic in the TypeScript Operation handler.

You can access the user object via the `user` parameter,
verify some claims, e.g. the user's email address,
or even perform a database query to check if the user has access to the resource.

If you want to return a `401 Unauthorized` error,
you can throw a `AuthorizationError` with a (optional) message.

```typescript
// .wundergraph/operations/math/add.ts
import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.query({
  input: z.object({
    a: z.number(),
    b: z.number(),
  }),
  handler: async ({ input, user }) => {
    if (!user) {
      throw new AuthorizationError('unauthorized');
    }
    if (user.email === undefined || user.email === null) {
      throw new AuthorizationError('email is required');
    }
    return {
      add: input.a + input.b,
    };
  },
});
```

In this case, the Gateway will not perform any authentication or authorization checks,
and the request will be forwarded to the TypeScript Operation handler which is responsible for the authorization logic.

You can also mix the two approaches, e.g. require authentication for all operations,
but then use custom authorization logic to check if the user has access to the resource.
