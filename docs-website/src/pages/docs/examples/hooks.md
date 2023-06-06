---
title: Hooks Example
pageTitle: WunderGraph - Examples - Hooks
description:
---

[The Hooks example](https://github.com/wundergraph/wundergraph/tree/main/examples/hooks) demonstrates how you can write custom Middleware functions to "hook" into the request lifecycle.

## Configuration

If you want to get the full picture of what's possible with hooks,
please have a look into the [wundergraph.server.ts reference](/docs/wundergraph-server-ts-reference).

In this case, we're keeping it simple and implement a `mutatingPostResolve` hook to inject a custom rocket into the response.
This hook allows us to modify the response object before it is sent back to the client.
We've got access to the client request, the response and the user,
so we're pretty flexible in what we can do with it.

```typescript
// wundergraph.server.ts
export default configureWunderGraphServer(() => ({
  hooks: {
    queries: {
      Dragons: {
        /**
         * mutatingPostResolve is a hook that is called after the query has been resolved.
         * It can be used to alter the response .
         */
        mutatingPostResolve: async ({ user, response, clientRequest }) => {
          console.log('mutatingPostResolve', clientRequest.requestURI);
          return {
            data: {
              spacex_dragons: [
                {
                  name: 'Custom Falcon 9',
                  active: true,
                },
                ...response.data.spacex_dragons,
              ],
            },
          };
        },
      },
    },
    mutations: {},
  },
  graphqlServers: [],
}));
```

## Learn more

- [Guides](/docs/guides)
- [WunderGraph Server TS Reference](/docs/wundergraph-server-ts-reference)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="simple" /%}
