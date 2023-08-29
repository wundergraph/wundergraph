---
title: REST/OpenAPI
description: The REST DataSource allows you to connect any REST API specified by an OpenAPI Specification.
---

# REST / OpenAPI DataSource

REST is the most commonly used style to build public APIs. With WunderGraph, you're able to turn any REST API specified by an OpenAPI Specification into a GraphQL API.
This way, you can treat it like any other GraphQL API and even stitch it together with other APIs.

## Add a REST API

To add a REST data source, edit `wundergraph/wundergraph.config.ts` and introspect the API like the config below.

```typescript
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { openapi } from '@wundergraph/sdk/datasources';

const jsp = openapi({
  namespace: 'jsp',
  source: {
    kind: 'file',
    filePath: '../countries.json', // this is the OpenAPI specification.
  },
});

export default {
  datasources: [jsp],
} satisfies WunderGraphConfig;
```

The REST data source is now added to your virtual graph and you can now write operations against it.

```graphql
query {
  jsp_countries {
    name
  }
}
```

## Learn more

- [How to write GraphQL and TypeScript operations](/docs/guides/writing-operations)
- [OpenAPI datasource reference](/reference/datasources/openapi)
