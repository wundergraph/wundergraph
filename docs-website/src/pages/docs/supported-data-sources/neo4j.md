---
title: Neo4j support
description: WunderGraph is the easiest way to expose Neo4j databases through GraphQL.
---

Neo4j is a popular graph database.
It's a great choice for many use cases,
especially when you need to model complex relationships between entities.

On top of that, Neu4h comes with native support for [GraphQL](https://neo4j.com/developer/graphql/)
through their [GraphQL Library](https://neo4j.com/docs/graphql-manual/current/).

As WunderGraph supports GraphQL out of the box,
Neo4j and WunderGraph are a great match.
You can use the GraphQL Library from Neo4j to define a GraphQL Schema through GraphQL,
or introspect an existing Neo4j database to generate a GraphQL Schema.
Then you can plug this GraphQL Schema into WunderGraph and add it to your virtual Graph.

This gives you all the benefits of Neo4j,
combined with the power of WunderGraph.

As Neo4j with the GraphQL Library is just another GraphQL API,
you can use the same configuration as for any other GraphQL API.

Here's an example configuration:

```typescript
// wundergraph.config.ts
const db = introspect.graphql({
  apiNamespace: 'db',
  url: new EnvironmentVariable('NEO4J_GRAPHQL_URL'),
  headers: (builder) => {
    builder.addStaticHeader('Authorization', new EnvironmentVariable('NEO4J_TOKEN'));
    return builder;
  },
});

configureWunderGraphApplication({
  apis: [db],
  server,
});
```
