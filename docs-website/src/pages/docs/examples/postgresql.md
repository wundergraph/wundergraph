---
title: PostgreSQL Example
pageTitle: WunderGraph - Examples - PostgreSQL
description:
---

[The Postgresql example](https://github.com/wundergraph/wundergraph/tree/main/examples/postgres) shows how to use WunderGraph with PostgreSQL.

For databases like Postgresql, MySQL, SQLite, SQLServer, MongoDB, CockroachDB and Planetscale, WunderGraph is able to directly speak GraphQL to your Database.
We automatically introspect your database and generate a GraphQL Schema,
you don't have to manually code a backend.

That said,
you can always use hooks to add additional business logic,
or even add custom GraphQL resolvers to decouple the clients from the database.

## Configuration

First, let's add Postgresql as a data source.
Simply point WunderGraph to your database using the connection string.

```typescript
// wundergraph.config.ts
const db = introspect.postgresql({
  apiNamespace: 'db',
  databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
});

configureWunderGraphApplication({
  apis: [db],
});
```

## Define an Operation

The GraphQL schema is generated automatically.
Next, we can define our Operation.
Let's query all messages.

```graphql
# .wundergraph/operations/Messages.graphql
{
  db_findManymessages {
    id
    message
    user_id
  }
}
```

## Call the generated RPC Endpoint

```shell
curl -X GET http://localhost:9991/operations/Messages
```

And we're done!
