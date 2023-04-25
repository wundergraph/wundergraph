---
title: Inject short-lived token into upstream requests
pageTitle: CacheAdvance - Inject short-lived token into upstream requests
description: In very security sensitive environments, it's necessary to generate a short-lived token for each request to the upstream API. This guide will help you to do that.
---

You might have an upstream that has very high security standards.
In order to authenticate against this upstream, you need to send a short-lived token alongside the request.
This short-lived token can be obtained by authenticating against your Identity Provider on a per-request basis.
Once the token is obtained, it needs to be injected into the upstream request.

This guide explains step-by-step how to do that.

First, let's configure our upstream so that we're forwarding the Authorization header from client requests:

```typescript
// wundergraph.config.ts

const secureUpstream = introspect.graphql({
  url: 'http://localhost:8111',
  loadSchemaFromString: someSchemaString,
  headers: (builder) => builder.addClientRequestHeader('Authorization', 'Authorization'),
});

configureWunderGraphApplication({
  apis: [secureUpstream],
});
```

The `headers` option on the upstream configuration defines that the "Authorization" header should be forwarded from the client request to the upstream request using the same name.
If you're using this technique for multiple upstreams, you can use different Header names to avoid conflicts.
What's missing is that we need to implement a hook to fetch the short-lived token and inject it into the client request headers.

```typescript
// wundergraph.server.ts
export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    mutations: {
      draw: {
        preResolve: async ({ clientRequest, user }) => {
          const token = await fetchShortLivedToken(user);
          clientRequest.headers.set('Authorization', 'Bearer ' + token);
        },
      },
    },
  },
}));
```

In this hook, we fetch the short-lived token from our Identity Provider and use the `clientRequest.headers.set` method to inject it into the client request.
As we've configured the upstream to forward the "Authorization" header, the token will be sent to the upstream.

## Conclusion

1. Configure the upstream to forward the Authorization header from client requests
2. Implement a hook to fetch the short-lived token and inject it into the client request headers
3. The WunderGraph HTTP transport will set the header on all upstream requests
