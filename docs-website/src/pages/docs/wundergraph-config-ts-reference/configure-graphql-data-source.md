---
title: Configure GraphQL Data Source
description: Introspect GraphQL services and add them to your Virtual Graph.
---

The `GraphQL` data source allows you to introspect GraphQL services and add them to your virtual Graph.

## Example Configuration

```typescript
// wundergraph.config.ts

const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
  requestTimeoutSeconds: 10, // optional
});

configureWunderGraphApplication({
  apis: [countries],
});
```

First, define the `url` which will be used to introspect the GraphQL service.
Next, add an optional `namespace` to put the GraphQL schema in a specific namespace.

Aside from the `url`, you can also define a headers configuration,
you can configure mTLS,
or set a different URL for subscriptions by setting `subscriptionsURL`.

## Introspecting protected graphql apis

Refer to the `configure introspection for protected API` guide.
