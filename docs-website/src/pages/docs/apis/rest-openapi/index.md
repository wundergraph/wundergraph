---
title: REST/OpenAPI
pageTitle: WunderGraph - REST/OpenAPI
description: The REST DataSource allows you to connect any REST API specified by an OpenAPI Specification.
---

REST is the most commonly used style to build public APIs. With WunderGraph, you're able to turn any REST API specified by an OpenAPI Specification into a GraphQL API.
This way, you can treat it like any other GraphQL API and even stitch it together with other APIs.

## Add a REST API

To add a REST data source, edit `.wundergraph/wundergraph.config.ts` and introspect the API like the config below.

```typescript
import { configureWunderGraphApplication, introspect } from '@wundergraph/sdk';

const jsp = introspect.openApi({
  apiNamespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../countries.json', // this is the OpenAPI specification.
  },
});

configureWunderGraphApplication({
  apis: [jsp],
});
```

The REST data source is now added to your virtual graph and you can now write operations against it.

## Write an operation

Create a new file `Countries.graphql` in the `operations` folder and add the following content:

```graphql
query {
  jsp_countries {
    name
  }
}
```

## Run the query

Queries are simply HTTP endpoints on your WunderGraph server.

```bash
npm run start

curl http://localhost:9991/operations/Countries
```

## Learn more

{% quick-links %}
{% quick-link title="Guides" icon="guides" href="/docs/guides/writing-operations" description="How to write GraphQL and TypeScript operations." /%}
{% quick-link title="Reference docs" icon="apis" href="/docs/wundergraph-config-ts-reference" description="All REST introspection options." /%}
{% /quick-links %}
