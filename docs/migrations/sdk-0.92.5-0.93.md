# Migration steps

| Version range | Migration complexity | Info                                        |
| ------------- | -------------------- | ------------------------------------------- |
| 0.92.5-0.93   | low-medium           | Unify hook interface, CamelCase properties. |

1. All hooks share now the same signature. We also ensured that base properties like `clientRequest`, `user`, `log`... are available to all hooks. Depending on the hook type some properties differs as before. Here is an example of how the new interface looks like:

```ts
global: {
  httpTransport: {
    onOriginRequest: {
      enableForAllOperations: true,
      hook: async ({ user, internalClient, clientRequest }) => {
        // let's add a custom hook to count every outgoing user request for analytics purposes
        internalClient.mutations.countOriginRequest({ request: clientRequest });
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
5. We created a new property `ctx.wundergraph` on the GraphQLContext that has the same interface as the new hook interface (see 1).

```ts
{
  async resolve(root, args, ctx, info) {
    ctx.wundergraph.log.info("Resolving query");
    const data = await ctx.wundergraph.internalClient.queries.InternalDragons();
  }
}
```

6. Internal operation calls accept an object as argument. This makes it easier to introduce new options.

```ts
{
  ctx.wundergraph.internalClient.queries.InternalDragons({
    input,
  });
}
```

7. All properties in the hooks `user` object are now camelCase. This aligns with the typescript ecosystem standards.
8. We also camelCase the properties of the `user` object in the web client.

> **Note**: Many changes can be easily picked up by typescript type inferrer.
