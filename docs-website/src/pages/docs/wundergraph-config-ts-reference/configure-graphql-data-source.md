---
title: Configure GraphQL Data Source
pageTitle: WunderGraph - Configure GraphQL Data Source
description:
---

The `GraphQL` data source allows you to introspect GraphQL services and add them to your virtual Graph.

## Example Configuration

```typescript
// wundergraph.config.ts

const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
})

const myApplication = new Application({
  name: 'app',
  apis: [countries],
})
```

First, define the `url` which will be used to introspect the GraphQL service.
Next, add an optional `namespace` to put the GraphQL schema in a specific namespace.

Aside from the `url`, you can also define a [headers configuration](/docs/wundergraph-config-ts-reference/configure-headers-for-http-based-data-sources),
you can [configure mTLS](/docs/wundergraph-config-ts-reference/configure-mtls-for-http-based-data-sources),
or set a different URL for subscriptions by setting `subscriptionsURL`.
