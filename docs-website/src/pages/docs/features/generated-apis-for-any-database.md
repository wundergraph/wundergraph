---
title: Generated APIs for any database
description: WunderGraph can introspect your database and generate a ready-to-use API from it.
---

Building APIs can be a lot of work.
When building a backend, you have to decide on the language, framework, orm or database client,
and make a lot of other decisions around architecture and deployment.

For business-logic heavy applications,
it makes a lot of sense and is necessary to build a custom backend.
However, a lot of applications need a simple CRUD API on top of an existing database.
This is a very good scenario to simply generate an API from the database.

Another scenario is when you have existing stores of data
and want to make them available to people who understand how to write a GraphQL Query,
but don't know how to create a backend themselves.

For these use cases, we've got a solution.
WunderGraph is able to introspect your database and generates a ready-to-use API from them.
It can be automatically secured, with authentication and authorization incl. role based access control
and a mechanism to inject claims into operations,
while you can add custom business logic using hooks.

All this means, you probably don't need to build your own custom backend but can rely on the standards we establish.
Instead of spending days on researching the best technologies and putting it all together,
you're able to go from database to application in a couple of minutes.

With WunderGraphs powerful code generation tooling,
you're able to create forms on top of your database-generated API simply by writing a GraphQL Operation.
Introspect a database, define a Query, and your application is ready to be deployed.
Just sparkle on top a bit of user interface, and you're good to go!

The following database management systems are currently supported:

- [PostgreSQL](/docs/supported-data-sources/postgresql)
- [MySQL](/docs/supported-data-sources/mysql)
- [Planetscale](/docs/supported-data-sources/planetscale)
- [SQLite](/docs/supported-data-sources/sqlite)
- [SQLServer](/docs/supported-data-sources/sqlserver)
- [Prisma](/docs/supported-data-sources/prisma)
- [MongoDB](/docs/supported-data-sources/mongodb-atlas)
- [FaunaDB](/docs/supported-data-sources/faunadb)
- [Neo4J](/docs/supported-data-sources/neo4j)
