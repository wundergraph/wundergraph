---
title: GraphQL
pageTitle: WunderGraph - GraphQL
description:
---

The GraphQL DataSource allows you to connect any compatible GraphQL Server.
WunderGraph supports Queries, Mutations as well as Subscriptions.

## Add a GraphQL DataSource

To add a GraphQL data source, edit `.wundergraph/wundergraph.config.ts` and introspect your GraphQL Server.

```typescript
import { configureWunderGraphApplication, introspect } from '@wundergraph/sdk';

const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});

configureWunderGraphApplication({
  apis: [countries],
});
```

The GraphQL data source is now added to your virtual graph and you can now write operations against it.

## Write an operation

Create a new file in the `operations` folder and add the following content:

```graphql
query {
  countries_countries {
    name
  }
}
```

## Next

{% quick-links %}
{% quick-link title="Guides" icon="guides" href="/docs/guides/writing-operations" description="How to write GraphQL and TypeScript operations." /%}
{% quick-link title="Reference docs" icon="apis" href="/docs/wundergraph-config-ts-reference" description="All GraphQL introspection options." /%}
{% /quick-links %}
