---
title: Multi-database multi-schema ORM
description: Use WunderGraph as an ORM for all your databases
---

As you might know,
WunderGraph comes with a rich set of supported data sources,
like MySQL, PostgreSQL, SQLite, and more...

WunderGraph introspects all the data sources you've configured and generates a GraphQL schema for you.
When you define a GraphQL Operation against this schema,
WunderGraph generates a JSON RPC Endpoint for you,
alongside a type-safe client, e.g. in TypeScript.

You're not forced to directly expose this API,
but can also use it internally to define an externally facing API.

In this scenario, WunderGraph can be seen as an ORM,
but with some very special capabilities.

## A powerful ORM for all your databases

Behind the scenes, WunderGraph uses Prisma, one of the most powerful and most loved ORMs in the world.
Combining both WunderGraph and Prisma gives you a couple of powerful advantages.

## Join data across multiple databases

WunderGraph allows you to connect to multiple databases out of the box.
This means, you can add multiple databases to your API layer,
and even join data across databases.

WunderGraph comes with a special feature, allowing you to nest your queries.
Using the \_\_join field you can query data from one database,
and then join it with data from a second database, or even other APIs.

## Turn your database into an API instantly

You can use WunderGraph as an ORM,
but it's also possible to directly expose an API from the database.

In comparison to other tools,
we're not directly exposing a GraphQL API,
but instead allow you to explicitly define the GraphQL Operations you'd like to expose.
This way, you get the flexibility of GraphQL,
but don't run into security issues of directly exposing the generated API.

## Separate the internal and external APIs

Another use case is to actually separate the API generated from the database from the API you're exposing to the client.

This can be done,
e.g. by putting the database into the namespace "internal",
while creating a second dedicated namespace called "external" for the public facing API.

Following this approach,
you can leverage the generated API,
but are not leaking the database schema into the client.
Instead, you're able to draw a line between the two,
and only use the APIs defined in the "external" namespace.
