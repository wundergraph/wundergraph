---
description: WunderGraph and the Prisma GraphQL Engine is the fastest way to build a secure and performant API on top of PostgreSQL, MySQL, SQLite, SQL Server, MongoDB + Atlas, Planetscale, Yugabyte & Neon.tech
---

WunderGraph allows you to turn any [Prisma](https://www.prisma.io) compatible database (e.g. PostgreSQL, MySQL, SQLite) into an API with almost no effort.
Some uses cases require planning and a lot of up front API design,
whereas others really just need a quick way to build an API on top of a database.

## Good Use Cases for the Prisma WunderGraph Data Source

There are a lot of tools out there that turn a database into an API.
What's special about the combination of WunderGraph and Prisma is that you're building on top of two giants.
Prisma is a very mature and well maintained project, [it's written in Rust and therefor very performant](https://github.com/prisma/prisma-engines).
WunderGraph uses Prisma internally to generate a GraphQL Schema from the database and translate GraphQL Operations into efficient SQL statements.

However, Prisma needs a powerful sidekick to turn your database into a production-grade API.
WunderGraph adds on top of Prisma by providing a secure JSON RPC API, authentication, authorization, live queries and most importantly, API composition & customization.

You can't just expose and API from your database.
You need a layer of authentication, authorization, input validation and error handling on top of it.
You need client code generation and a way to customize the API.
You need a way to compose multiple APIs, maybe even from different databases and external APIs.
WunderGraph does all of that for you.

Together with Prisma, the duo is a powerful combination that allows you to build a production-grade API in minutes.

## Quick Example / Overview of a WunderGraph + Prisma API

Let's assume we've introspected an SQLite database with the following schema:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./users_post.sqlite"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  author    User    @relation(fields: [authorID], references: [id])
  authorID  Int
}
```

Here's the introspection config:

```typescript
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { prisma } from '@wundergraph/sdk/datasources';

// wundergraph.config.ts
const usersPost = prisma({
  namespace: 'users_post',
  prismaFilePath: './schema.prisma',
});

export default {
  datasources: [usersPost],
} satisfies WunderGraphConfig;
```

Next, we've defined a WunderGraph Operation, turning a GraphQL Query into a JSON RPC API.

```graphql
# wundergraph/operations/users/first.graphql
query {
  user: users_post_findFirstUser {
    id
    email
    name
    posts {
      id
      title
      content
    }
  }
}
```

We can now call this operation from the WunderGraph JSON RPC API:

```bash
curl http://localhost:9991/operations/users/first
```

Contrary to other solutions, WunderGraph does not by default expose the entire database as an API.
Instead, we introspect the database and generate what we call the Virtual Graph.
From the Virtual Graph, the user can define a set of Operations, either using GraphQL or TypeScript to have full control over the exposed API surface.
It's possible to directly expose the generated GraphQL API,
but depending on your use case, you'd much rather have full control over what is exposed and how.

## Getting Started

In order to get started, all you need is to "introspect" your database in your `wundergraph.config.ts` file.
WunderGraph will introspect the tables and columns in your database and generate a GraphQL schema for you.
In case of MongoDB, we're using sampling to generate the Schema.

What this means is that we're "pulling" the schema from the database.
In most cases, this is the best way to go.
However, e.g. in the case of Planetscale or MongoDB, it might be easier to use a `schema.prisma` file to define the schema.
Planetscale for example doesn't support foreign keys,
so if we would introspect the database, we would not be able to see any relations.

Here's a list of the Databases supported by Prisma and WunderGraph and how to configure them.
We're assuming that you've already created a WunderGraph project.
If not, please follow [this guide](/docs/getting-started/quickstart).

Once you've got a WunderGraph project up and running,
you can add one of the below data sources to your `wundergraph.config.ts` file.

When you now run `wunderctl up`, WunderGraph will introspect the database,
generate the GraphQL Schema and start the WunderGraph server.
You can view the generated GraphQL Schema either by looking at the `wundergraph/generated/wundergraph.schema.graphql` file or by visiting `http://localhost:9991/graphql`.
If the GraphQL Endpoint is not available, make sure that you've [configured it properly](/docs/wundergraph-config-ts-reference/configure-advanced-security#enable-graph-ql-endpoint).

### PostgreSQL

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { postgresql } from '@wundergraph/sdk/datasources';

const myDB = postgresql({
  namespace: 'my_db',
  databaseURL: 'postgres://postgres:postgres@localhost:5432/postgres',
});

export default {
  datasources: [myDB],
} satisfies WunderGraphConfig;
```

A full PostgreSQL Example [can be found here](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs-postgres-prisma).

### MySQL

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { mysql } from '@wundergraph/sdk/datasources';

const myDB = mysql({
  namespace: 'my_db',
  databaseURL: 'mysql://root:root@localhost:3306/my_db',
});

export default {
  datasources: [myDB],
} satisfies WunderGraphConfig;
```

### SQLite

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { sqlite } from '@wundergraph/sdk/datasources';

const myDB = sqlite({
  namespace: 'my_db',
  databaseURL: 'file:./my_db.db',
});

export default {
  datasources: [myDB],
} satisfies WunderGraphConfig;
```

### MongoDB + Atlas

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { mongodb } from '@wundergraph/sdk/datasources';

const myDB = mongodb({
  namespace: 'my_db',
  databaseURL: 'mongodb://localhost:27017/my_db',
});

export default {
  datasources: [myDB],
} satisfies WunderGraphConfig;
```

### SQL Server

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { sqlserver } from '@wundergraph/sdk/datasources';

const myDB = sqlserver({
  namespace: 'my_db',
  databaseURL: 'sqlserver://sa:sa@localhost:1433/my_db',
});

export default {
  datasources: [myDB],
} satisfies WunderGraphConfig;
```

WunderGraph (Prisma) uses sampling to generate a GraphQL Schema for MongoDB.
In some cases, e.g. when you have very little data in your database,
this might not lead to a good result.
In this case, you can use the [special "Prisma" Data Source](/docs/databases/prisma#the-special-prisma-data-source) which gives you full control over the generated GraphQL Schema.

### Planetscale

Planetscale DB uses the MySQL protocol, so introspection works similar to MySQL.

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { planetscale } from '@wundergraph/sdk/datasources';

const myDB = planetscale({
  namespace: 'my_db',
  databaseURL: 'mysql://root:root@localhost:3306/my_db',
});

export default {
  datasources: [myDB],
} satisfies WunderGraphConfig;
```

As mentioned above, Planetscale doesn't support foreign keys.
If you're looking for a solution to still use relations in the generated GraphQL Schema,
you can use the [special "Prisma" Data Source](/docs/databases/prisma#the-special-prisma-data-source).

### Yugabyte

Both Yugabyte and Neon.tech use the PostgreSQL protocol,
so we're introspecting them in the same way as PostgreSQL.

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { postgresql } from '@wundergraph/sdk/datasources';

const myDB = postgresql({
  namespace: 'my_db',
  databaseURL: 'postgres://postgres:postgres@localhost:5432/postgres',
});

export default {
  datasources: [myDB],
} satisfies WunderGraphConfig;
```

### Neon.tech

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { postgresql } from '@wundergraph/sdk/datasources';

const myDB = postgresql({
  namespace: 'my_db',
  databaseURL: 'postgres://postgres:postgres@localhost:5432/postgres',
});

export default {
  datasources: [myDB],
} satisfies WunderGraphConfig;
```

## The "special" Prisma Data Source

When the WunderGraph Prisma Data Source is used,
we pull meta-data from the database and generate a GraphQL Schema for you.
This is similar to running `npx prisma db pull`,
which will populate the `schema.prisma` file with the meta-data from the database.

In the second step, we're using the Prisma introspection engine to generate a GraphQL Schema from the introspected Prisma Schema.
And that's exactly where the "special" Prisma Data Source might come in handy.

Let's say that the database you're using has some limitations in terms of how you can introspect it,
or you're not 100% happy with how the Database types are being mapped to GraphQL types.
Another use case might be that you cannot introspect the database directly, because during the introspection process,
you don't have access to the database.

In all of these cases, you can use the "special" Prisma Data Source,
which works fully offline and gives you full control over the generated GraphQL Schema.

Simply pass a `schema.prisma` file to the `introspect.prisma` function and you're good to go.

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { prisma } from '@wundergraph/sdk/datasources';

const myDB = prisma({
  namespace: 'my_db',
  prismaFilePath: './schema.prisma',
});

export default {
  datasources: [myDB],
} satisfies WunderGraphConfig;
```

One way to work with this Data Source is to create a basic `schema.prisma` file with just the datasource defined.
Then, you can run `npx prisma db pull` to populate the `schema.prisma` file with the meta-data from the database and use the result for the WunderGraph introspection.
If you want to adjust the schema, e.g. to change the mapping of a type, or to add a relation,
you can do so in the `schema.prisma` file and WunderGraph will automatically pick up the changes.

## Writing Custom SQL Queries

When using the Prisma-generated GraphQL API, we're more or less using GraphQL as our ORM and don't have to write any SQL queries.
That's super powerful for two reasons.
For one, we don't have to understand anything about the underlying database.
If we're able to write GraphQL Operations, we can talk to the database.
Second, we get out-of-the-box type-safety for the data we're querying.

When defining a GraphQL Operation, WunderGraph will parse it and generate TypeScript (or any other language) types for the data we're querying.
These types can be fed into the generated client, so we're able to make API calls type-safe.
Combined with integrations for frameworks like React, NextJS, Svelte & more, you get a fully type-safe client integration for your API.
We call this end-to-end type-safety.

However, there's a downside to this approach.
While an ORM-like interface is super powerful 90% of the time,
there are some cases where you might want to write a custom SQL Query as an escape hatch.
This allows you to call a function or procedure in the database,
or to write a query that's not supported by the ORM.

WunderGraph supports this use case by allowing you to define custom SQL Queries within a GraphQL Operation.
There are two ways to do this.
You can either return the resulting data as a JSON object,
or you can specify the response shape using a Selection Set.

If you're using the JSON response style, it's the responsibility of the client to parse the JSON and validate the data.
If you're using the Selection Set style instead, the WunderGraph Engine will ensure that the data is valid,
and you'll get a fully type-safe client integration.

### Raw SQL Queries with JSON Response

Use the `{NAMESPACE}_queryRawJSON` Query to execute a raw SQL Query and return the result as a JSON object.

```graphql
query {
  users: my_db_queryRawJSON(query: "select id,email,name from User limit 2")
}
```

As you can see, the resulting type is a JSON scalar,
so we're not able to select any fields from the result.
If you want to add more type-safety to the response,
you can use the Selection Set style instead.

### Raw SQL Queries with Selection Set Response

```graphql
query ($email: String!) {
  row: my_db_queryRaw(query: "select id,email,name from User where email = ? limit 1", parameters: [$email]) {
    id: Int
    email: String
    name: String
  }
}
```

When using the `{NAMESPACE}_queryRaw` Query, you have to specify a Selection Set to define the response shape.
Here's how it works:

For each column in the result set, you need to specify a field in the Selection Set with the name as the alias,
and the Type as fields.

Example:

- `id` -> `id: Int`
- `email` -> `email: String`
- `name` -> `name: String`

The id column is an integer, so we're defining a field with the alias `id` and the field Name `Int`.
The email column is a string, so we're defining a field with the alias `email` and the field Name `String`.

What WunderGraph does internally is to generate mappings from the column names to the field names.
By using the alias, we're able to map the column names to the field names.
The field allow the user to specify which type the field should have.

This approach adds a bit of overhead,
but it's a flexible way to offer escape hatches without sacrificing type-safety on the client side.

### Raw SQL Query for Mutations

If you want to execute a raw SQL Query to mutate data in the database,
you can use the `{NAMESPACE}_executeRaw` Mutation.

```graphql
mutation ($id: String!, $name: String!, $email: String!) {
  my_db_executeRaw(query: "insert or ignore into User (id,name,email) values (?,?,?)", parameters: [$id, $name, $email])
}
```

In this example, we're using the SQLite dialect using the `?` placeholder for the parameters.
If you're using e.g. PostgreSQL, you can use the `$1` placeholder instead.

```graphql
mutation ($id: String!, $name: String!, $email: String!) {
  my_db_executeRaw(
    query: "insert or ignore into User (id,name,email) values ($1,$2,$3)"
    parameters: [$id, $name, $email]
  )
}
```

## Support for Prisma Views and Database Views

Prisma now supports views as an early preview feature, and so do we!

Executing raw SQL queries is a very powerful feature,
but it might get a little out of hand when your SQL statements get more complex.
To make things easier, you can now use Prisma Views to define a view on top of your database
and query it in a type-safe way.

To learn more about Prisma Views, checkout the official [Prisma Docs](https://www.prisma.io/docs/concepts/components/prisma-schema/views).

Let's go through an example to see how it works.
First, define a view in your database.

```PostgreSQL
CREATE VIEW UserName AS SELECT id, name FROM "User";
```

Next, define the view in your Prisma Schema so we can generate the types for it.

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["views"]
}

datasource db {
  provider = "sqlite"
  url      = "file:./users_post.sqlite"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}

view UserName {
  id   Int    @unique
  name String
}
```

WunderGraph will now add the view to the generated GraphQL Schema,
so you can query it like any other table without having to define the response shapre.

## Injecting Claims into your Database API

Let's say you'd like to create an API that allows users to view their own data.
For this to work, you need to ensure that the user is authenticated,
you need to know which user is making the request,
and you need to inject this information into the request to the database.

With WunderGraph, this seemingly complex task is actually quite simple.
Let's modify one of the examples above to see how it works.

```graphql
query ($email: String! @fromClaim(name: EMAIL)) {
  row: my_db_queryRaw(query: "select id,email,name from User where email = ? limit 1", parameters: [$email]) {
    id: Int
    email: String
    name: String
  }
}
```

All we've changed is to add the `@fromClaim` directive to the `$email` parameter.
Let's take a look at what this does.

- The `@fromClaim` directive tells WunderGraph to inject the value of the claim with the name `EMAIL` into the request.
- Applying the directive to the `email` variable also removes the `email` field from the generated JSON Schema for this Operation.
  This will disallow the client to specify the `email` field in the request.
- Instead, the user MUST now be authenticated and the `EMAIL` claim MUST be present in the JWT.
  If the user is not authenticated, the request will fail with a `401 Unauthorized` error.
  If the `EMAIL` claim is not present, the request will fail with a `400 Bad Request` error.

WunderGraph offers cookie-based and token-based authentication.
In both cases, WunderGraph will automatically extract the claims from the JWT and inject them into the request.

## Namespacing your Database API

You might have noticed that we're using the `my_db` namespace in the examples above.
When introspecting a database, we've specified an `namespace`,
and when writing a GraphQL Operation, all root fields are also prefixed with this namespace.

At WunderGraph, we like to think about APIs like Dependencies.
A package manager uses namespaces or modules to organize dependencies and avoid naming conflicts.
Similarly, WunderGraph applies the same concept to APIs.

You're not limited to just using one single API or database,
so it's important to be able to organize your APIs into namespaces.

For that reason, always make sure to use a unique namespace for each API,
and you should never run into naming conflicts.

## WunderGraph doesn't automatically expose the GraphQL Schema / API

One important thing to note is that WunderGraph doesn't automatically expose the GraphQL Schema or API.
This is a deliberate design decision to avoid exposing the database schema to the public.
Using TypeScript Operations, you're also able to put a layer of abstraction between the database and the client.

Directly exposing the Database to the client, e.g. through a generated GraphQL Schema, has some advantages but also comes at a cost.
The main advantage is that you don't have to deal with the API layer at all.
However, this comes at the cost of tightly coupling the client to the database.

Our goal is to provide a flexible and powerful abstraction layer that allows you to build fast,
but also keep the architecture decoupled and scalable.
You might want to modify or change the underlying database schema at some point,
at which point you'd have to update all clients that are directly accessing the database.

With WunderGraph, we're trying to give you the optimum in terms of developer efficiency without cornering you into a specific architecture.
For that reason, we encourage you to use TypeScript Operations to build your API layer instead of using other tools that directly expose the database to the client.
