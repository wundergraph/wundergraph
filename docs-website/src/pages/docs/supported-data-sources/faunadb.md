---
title: FaunaDB support
description: WunderGraph is the easiest way to build web applications on top of FaunaDB.
---

FaunaDB is a serverless cloud database with a GraphQL API.
It's a great choice for building modern web applications.
You can get a geo-replicated database up and running in minutes.

What's more, FaunaDB comes with native GraphQL support.
You can use a GraphQL schema to define your database schema,
and you can use GraphQL to interact with the database.

All of this makes FaunaDB a great choice as your data source for WunderGraph.
As WunderGraph supports GraphQL out of the box,
all you need to do is plug your FaunaDB API into your virtual Graph and you're good to go.

Here's an example configuration:

```typescript
// wundergraph.config.ts
const db = introspect.graphql({
  apiNamespace: 'db',
  url: new EnvironmentVariable('FAUNADB_GRAPHQL_URL'),
  headers: (builder) => {
    builder.addStaticHeader('Authorization', new EnvironmentVariable('FAUNADB_TOKEN'));
    return builder;
  },
});

configureWunderGraphApplication({
  apis: [db],
  server,
});
```

This wires up the FaunaDB API to your virtual Graph and configures the Authorization header with the `FAUNADB_TOKEN` environment variable.

## Why WunderGraph and FaunaDB together?

FaunaDB is great when it comes to storing data.
But what about authentication, authorization, caching?
What if you'd like to add custom hooks to enhance the behavior of your API?
What about file uploads?
What if you'd like to integrate with other APIs?

All of these are not handled by a database,
but WunderGraph takes care of all of these issues.

Last but not least,
WunderGraph acts as a layer of protection between your database and your clients.
Instead of directly exposing your database to the client,
WunderGraph can sit in the middle to set boundaries and enforce security policies.
This way, your clients are not directly coupled to the database,
but only depend on the JSON-RPC API layer exposed by WunderGraph.

As you can see,
WunderGraph and FaunaDB are a great match.
They complement each other perfectly.

## Full Example

If you'd like to check out a Full Example of a WunderGraph application using FaunaDB as a data source,
check out the [FaunaDB NextJS Example](https://github.com/wundergraph/wundergraph/tree/main/examples/faunadb-nextjs).
