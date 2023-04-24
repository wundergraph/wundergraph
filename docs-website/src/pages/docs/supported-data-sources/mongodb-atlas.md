---
title: MongoDB / Atlas to GraphQL
pageTitle: WunderGraph - MongoDB / Atlas
description: WunderGraph is the easiest way to expose MongoDB / Atlas APIs through GraphQL.
---

The MongoDB / Atlas DataSource allows you to turn any MongoDB / Atlas protocol compatible Database into a secure production-grade GraphQL API.

Simply point WunderGraph to your Database, and we take care of all the heavy lifting.

In contrast to other offerings, the resulting API is production-ready from the start with authentication & authorization out of the box.

No data gets exposed if you didn't explicitly allow it.

## Highlights

### Injecting Claims

WunderGraph, by default, does NOT expose the generated (virtual) GraphQL API.
To expose some functionality of the Graph, you have to write a Query or Mutation.
The Query will be compiled into a secure RPC Endpoint.

With that in mind, it should be clear that clients are not able to modify Queries at runtime.
All they can do is invoke the compiled RPC Endpoint.

Keeping Queries on the backend gives WunderGraph superpowers.
If you look at the following Query, you'll see a custom `@fromClaim` directive.

```graphql
mutation AddMessage($email: String! @fromClaim(name: EMAIL), $name: String! @fromClaim(name: NAME), $message: String!) {
  createOnemessages(
    data: {
      message: $message
      users: { connectOrCreate: { create: { name: $name, email: $email }, where: { email: $email } } }
    }
  ) {
    id
    message
  }
}
```

This directive does two things.
First, it enforces that a user must be authenticated to be able to use this method.
Second, we take the `email` and `name` Claims of the user and inject them into the Mutation.

> Claims are name value pairs of information about the authenticated user.

This method allows us to add a layer of authentication & authorization by just writing a directive.

### Live Queries

WunderGraph allows you to turn any GraphQL Query into a Live-Query.
Live-Queries are regular Queries that automatically update the user interface.
Data gets updated by polling the upstream DataSource continually using a predefined interval which you can configure.

Combined with a MongoDB / Atlas Database, you're able to easily build Realtime Applications like a Chat.

## Reference

Follow [this Link](/docs/wundergraph-config-ts-reference/configure-mongodb-atlas-data-source) to find more information on how to use the DataSource.
