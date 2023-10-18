---
title: Apollo Federation
pageTitle: WunderGraph - Apollo Federation
description: Add Apollo Federation to your WunderGraph application.
---

Federation helps companies implement GraphQL at scale and allows you to combine multiple GraphQL APIs (subgraphs) into a single Supergraph. WunderGraph has native support for Apollo federation, it supports Queries, Mutations as well as Subscriptions.

It brings a lot of useful features to implement Graphs across multiple teams in a "federated" way, hence the name.
It was [invented and specified by Apollo](https://www.apollographql.com/docs/federation/federation-spec/).

WunderGraph is extremely fast executing GraphQL Operations and is therefore a great fit for a Federation Gateway.

## Add a Apollo Federation DataSource

To add a Apollo Federation data source, edit `.wundergraph/wundergraph.config.ts` and introspect the SubGraphs like the config below.

```typescript
import { configureWunderGraphApplication, introspect } from '@wundergraph/sdk';

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
});

configureWunderGraphApplication({
  apis: [federatedApi],
});
```

Simply add all the URLs of your SubGraphs to the `upstreams` array.

## Learn more

{% quick-links %}
{% quick-link title="Guides" icon="guides" href="/docs/guides/writing-operations" description="How to write GraphQL and TypeScript operations." /%}
{% quick-link title="Reference docs" icon="apis" href="/docs/wundergraph-config-ts-reference" description="All Federation introspection options." /%}
{% /quick-links %}
