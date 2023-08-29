---
title: GraphQL Federation DataSource
description: Add GraphQL Federation to your WunderGraph application.
---

# GraphQL Federation DataSource

Federation helps companies implement GraphQL at scale and allows you to combine multiple GraphQL APIs (subgraphs) into a single Supergraph. WunderGraph has native support for Apollo federation, it supports Queries, Mutations as well as Subscriptions.

It brings a lot of useful features to implement Graphs across multiple teams in a "federated" way, hence the name.
It was [invented and specified by Apollo](https://www.apollographql.com/docs/federation/federation-spec/).

WunderGraph is extremely fast executing GraphQL Operations and is therefor a great fit for a Federation Gateway.

## Add a Apollo Federation DataSource

To add a Apollo Federation data source, edit `wundergraph/wundergraph.config.ts` and introspect the SubGraphs like the config below.

```typescript
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { federation } from '@wundergraph/sdk/datasources';

const federatedApi = federation({
  namespace: 'federated',
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

export default {
  datasources: [federatedApi],
} satisfies WunderGraphConfig;
```

Simply add all the URLs of your SubGraphs to the `upstreams` array.

## Authenticated GraphQL APIs

If you need to authenticate against your federated GraphQL API, you can use the `introspection` option to add custom headers to your requests.

```typescript
const federatedApi = federation({
  namespace: 'github',
  upstreams: [
    {
      url: 'http://localhost:4001/graphql',
      introspection: {
        headers(builder) {
          return builder.addStaticHeader('Authorization', `Bearer ${process.env.SECRET}`);
        },
      },
    },
  ],
});
```

To forward the Authorization header from the client to the upstream or set static headers, you can use the `headers` option.

```typescript
const github = graphql({
  namespace: 'github',
  upstreams: [
    {
      url: 'http://localhost:4001/graphql',
      headers(builder) {
        return (
          builder
            // We forward `X-Secret` to the `Authorization` header.
            .addClientRequestHeader('Authorization', 'X-Secret')
        );
      },
    },
  ],
});
```

The `X-Github-Token` header will be forwarded from the client to the upstream, while the `X-Github-Next-Global-ID` header will be added to every request.

## Learn more

- [How to write GraphQL and TypeScript operations](/docs/guides/writing-operations)
- [Federation datasource reference](/reference/datasources/graphql)
