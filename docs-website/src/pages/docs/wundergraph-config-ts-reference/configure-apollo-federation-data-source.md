---
title: Configure Apollo Federation Data Source
pageTitle: WunderGraph - Configure Apollo Federation Data Source
description:
hideTableOfContents: true
---

With the `Apollo Federation` data source,
you can introspect multiple `SubGraphs`,
and WunderGraph will automatically combine them into a `SuperGraph`,
applies namespacing and will add the resulting GraphQL Schema to your virtual Graph.

{% callout type="warning" %}
WunderGraph supports Apollo Federation with Subscriptions out of the box.
No changes are required to your code.
{% /callout %}

## Example Configuration

```typescript
const federatedApi = introspect.federation({
  apiNamespace: 'federated',
  upstreams: [
    {
      url: 'http://localhost:4001/graphql',
    },
    {
      url: 'http://localhost:4002/graphql',
    },
    {
      url: 'http://localhost:4003/graphql',
    },
    {
      url: 'http://localhost:4004/graphql',
    },
  ],
})

const myApplication = new Application({
  name: 'app',
  apis: [federatedApi],
})
```

Simply add all the URLs of your SubGraphs to the `upstreams` array.
Aside from the `url`, you can also define a [headers configuration](/docs/wundergraph-config-ts-reference/configure-headers-for-http-based-data-sources),
you can [configure mTLS](/docs/wundergraph-config-ts-reference/configure-mtls-for-http-based-data-sources),
or set a different URL for subscriptions by setting `subscriptionsURL`.
