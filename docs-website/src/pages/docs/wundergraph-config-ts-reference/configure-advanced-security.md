---
title: Configure advanced security
description: Configure advanced security features of WunderGraph
---

This section is about the `security` property of `configureWunderGraphApplication`.

```typescript
configureWunderGraphApplication({
  security: {
    enableGraphQLEndpoint: true,
    allowedHosts: ['localhost:3000'],
  },
});
```

## Enable GraphQL Endpoint

Setting this to `true` will enable the GraphQL endpoint.
This means that the WunderGraph server will expose a GraphQL endpoint at `/graphql`.
If you open this endpoint in the browser, you will see the GraphQL Playground,
which can be used to explore the GraphQL schema and try out GraphQL Operations.

{% callout type="warning" %}

Keep in mind that enabling the GraphQL endpoint is a security risk.
Doing so allows anyone to bypass the WunderGraph security features.
You should only enable this in production if you explicitly want everyone with access to the server to run arbitrary GraphQL Operations.

{% /callout %}

## Allowed Hosts

The WunderGraph Server / WunderNode can be restricted to only allow certain hosts to access it.
What this means is that the router of the WunderGraph Server will look at the `Host` header of the incoming request,
and if it doesn't match the allowed hosts, it will return a `404 Not Found` response.

{% callout type="warning" %}
By default, all hosts are allowed.
{% /callout %}
