---
title: Configure Prisma Data Source
description: Introspect Prisma schema's and add them to your Virtual Graph.
---

The Prisma data source loads a Prisma schema from a file and generates a GraphQL schema.

## Example Configuration

```typescript
// wundergraph.config.ts

const db = introspect.prisma({
  apiNamespace: 'wundergraph',
  prismaFilePath: './schema.prisma',
  introspection: {
    disableCache: true,
  },
});

configureWunderGraphApplication({
  apis: [db],
});
```

Define the `prismaFilePath` which is the file path to the schema.
To avoid naming conflicts, you should also define an `apiNamespace`.

Since the Prisma DataSource does not perform any remote operations during instrospection and
generates your GraphQL schema very fast, we recommend turning off the cache.

To do so, specify `disableCache: true`.
