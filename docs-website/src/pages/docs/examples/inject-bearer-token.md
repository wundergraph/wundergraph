---
title: Inject Bearer Token Example
pageTitle: WunderGraph - Examples - Inject Bearer Token
description:
---

[The inject bearer token example](https://github.com/wundergraph/wundergraph/tree/main/examples/inject-bearer) demonstrates how you can use hooks to inject a token into origin requests.

## Configuration

WunderGraph allows you to write http transport hooks,
so you're able to manipulate requests before they are sent to the server,
and responses before they are returned to the resolvers.

Hooks have access to the user object,
so you can inject metadata from the user into a request,
like an ID token in this example.

```typescript
// wundergraph.server.ts
export default configureWunderGraphServer(() => ({
  hooks: {
    global: {
      httpTransport: {
        onOriginRequest: {
          enableForAllOperations: true,
          hook: async ({ request, user }) => {
            if (user && user.rawIdToken) {
              request.headers.set('Authorization', `Bearer ${user.rawIdToken}`);
            }
            return request;
          },
        },
      },
    },
    queries: {},
    mutations: {},
  },
}));
```

If you want to learn more about http transport hooks,
have a look at the onOriginRequest hook reference.

## Learn more

- [Guides](/docs/guides)
- [WunderGraph Server TS Reference](/docs/wundergraph-server-ts-reference)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="inject-bearer" /%}
