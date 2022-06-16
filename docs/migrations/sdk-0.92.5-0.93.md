# Migration steps

| Version range | Migration complexity | Info                 |
| ------------- | -------------------- | -------------------- |
| 0.92.5-0.93   | low                  | Unify hook interface |

1. All hooks share now the same signature. We also ensured that base properties like `clientRequest` are available to all hooks. Depending on the hook type some properties differs as before. Here is an example of how the new interface looks like:

```ts
global: {
  httpTransport: {
    onOriginResponse: {
      enableForAllOperations: true,
        hook: async ({ user, internalClient, clientRequest }) => {
          // let's add a custom hook to count every user request for billing purposes
          internalClient.mutations.AddRequestAudit({ email: user.user_id, request: clientRequest });
        }
    }
  }
}

authentication: {
  postAuthentication: async ({ user, internalClient }) => {
    // let's add a custom hook to update the last login field for the user
    internalClient.mutations.SetLastLogin({ email: user.email });
  }
}

queries: {
  Dragons: {
    // A single argument. Here we use object destructuring for better readability.
    preResolve: async ({ user, log, clientRequest, setClientRequestHeader, internalClient, ...others }) => {};
  }
}
```

2. We removed the `ServerContext` from the signature of the `configureWunderGraphServer` function because it introduced another internal client that has no access to the request. This behavior is hard to understand and we want to avoid it.
3. Rename `onRequest` hook to `onOriginRequest`. This makes it more clear that this hook is not called a single time per operation.
4. Rename `onResponse` hook to `onOriginResponse`. This is the companion hook to the `onOriginRequest` hook.
5. We unified the GraphQLContext `ctx.wgContext` to the new hook interface (see 1).

```ts
{
  async resolve(root, args, ctx, info) {
    ctx.wgContext.log.info("Resolving query");
    const data = await ctx.wgContext.internalClient.queries.InternalDragons();
  }
}
```

> **Note**: Many changes can be easily picked up by typescript type inferrer.
