---
title: Extend JSON fields with more specific types
pageTitle: WunderGraph - Extend JSON fields with more specific types
description: Some APIs expose JSON fields, which limits type safety. This guide will help you to extend the JSON fields with more specific types.
---

You might already know that WunderGraph uses Prisma to let you connect to a database such as SQLite, MySQL, PostgreSQL, SQL Server or MongoDB.
The full list of supported DataSources can be found in the supported DataSources section.

Thanks to the feedback from our lively community, we've realised that it's a common use case to store JSON columns in your database.
If you're using a database like PostgreSQL, you can use the `json` or `jsonb` type to store JSON columns.
These columns would be represented in the GraphQL schema as a `JSON` scalar type.

If you're familiar with TypeScript, we're essentially treating JSON columns as the `any` type.
Internally, we're JSON-encoding the value to a string before storing it in the database and decoding it when reading it from the database.
This way, a field with the `JSON` scalar type is very easy to use already.

However, there's a drawback with this approach.
If you're storing complex JSON objects, you're not able to leverage the type system of GraphQL.
There's no easy way to select a specific field from a JSON object.
You have to manually parse it and extract the field you want.

This strategy presents a solution to this problem.
WunderGraph allows you to extend the GraphQL Schema and replace specific JSON fields with a custom type.
This way you can leverage the type system of GraphQL while being able to store the data as a JSON object in your database.

Let's have a look at an example, a simple chat application where we use a JSON column to store some extra information attached to the messages.

## Here's how you introspect your database before we're adding a custom type

```typescript
// wundergraph.config.ts
const db = introspect.postgresql({
  apiNamespace: 'db',
  databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
});
```

We're simply pointing WunderGraph to the database we're using.
You can learn more about configuring a PostgreSQL datasource [here](/docs/wundergraph-config-ts-reference/configure-postgresql-data-source).

We're showcasing this approach with PostgreSQL, but you can use [any database you like](/docs/supported-data-sources).

## This is how our GraphQL Operations would look like before we're adding a custom type

```graphql
mutation (
  $email: String! @fromClaim(name: EMAIL)
  $name: String! @fromClaim(name: NAME)
  $message: String!
  $payload: JSON!
) @rbac(requireMatchAll: [user]) {
  createOnemessages: db_createOnemessages(
    data: {
      message: $message
      payload: $payload
      users: { connectOrCreate: { create: { name: $name, email: $email }, where: { email: $email } } }
    }
  ) {
    id
    message
    payload
  }
}
```

The first Operation allows a user to create a new message.
We're injecting the `$email` and `$name` variables from the Claims provided by the users' identity provider.
The `$message` variable is of type String.
The `$payload` variable is of type JSON, so there's no way to validate the input.
The user could send any valid JSON object.

If you're wondering how the `@fromClaim` directive works,
have a look at the `@directives` section of the reference.

```graphql
{
  findManymessages: db_findManymessages(take: 20, orderBy: [{ id: desc }]) {
    id
    message
    payload
    users {
      id
      name
    }
  }
}
```

The second Operation allows a user to fetch all messages.
Similarly to the mutation, we're not able to "look into" the payload field.
It's a scalar type, so the client needs to know how to parse it.
What happens if a user stores an unexpected object in the payload field?
There's no way to validate the input.

As you can see, using a JSON column gives you a lot of flexibility.
At the same time, this approach comes with a few drawbacks.

## Now, let's extend the GraphQL schema with our custom type

```typescript
// wundergraph.config.ts
const db = introspect.postgresql({
  apiNamespace: 'db',
  databaseURL: 'postgresql://admin:admin@localhost:54322/example?schema=public',
  schemaExtension: `
        type MessagePayload {
            extra: String!
        }
        input MessagePayloadInput {
            extra: String!
        }
    `,
  replaceCustomScalarTypeFields: [
    {
      entityName: 'messages',
      fieldName: 'payload',
      responseTypeReplacement: 'MessagePayload',
      inputTypeReplacement: 'MessagePayloadInput',
    },
  ],
});
```

First, we're adding a "schema extension" to our GraphQL schema.
We're simply adding two new definitions to our schema,
an input type definition and a type definition for the response.

Next, we define which JSON fields we want to replace.
In our case, the entity (table) is `messages` and the field is `payload`.

Finally, we're defining which type to use as the input replacement as well as the response replacement.

## Finally, let's see how our GraphQL Operations look like now

Now that we've added our custom type, we have to modify our GraphQL Operations.
The mutation now must use `db_MessagePayloadInput` as the input type.
As WunderGraph is automatically generating a JSON-Schema validation middleware for each GraphQL Operation,
we're now validating the input for the `$payload` variable.

Additionally, you can see that we now have to select the `extra` field from the `MessagePayload` type in the response.
As payload is no longer a scalar type, we have to make a selection.
This gives us the additional benefit that a generated client can directly access the `extra` field without having to parse the JSON object.

```graphql
mutation (
  $email: String! @fromClaim(name: EMAIL)
  $name: String! @fromClaim(name: NAME)
  $message: String!
  $payload: db_MessagePayloadInput!
) @rbac(requireMatchAll: [user]) {
  createOnemessages: db_createOnemessages(
    data: {
      message: $message
      payload: $payload
      users: { connectOrCreate: { create: { name: $name, email: $email }, where: { email: $email } } }
    }
  ) {
    id
    message
    payload {
      extra
    }
  }
}
```

Similarly to the mutation,
our Query to get the top20 messages also needs adjustment.
We have to select the `extra` field as well which gives us type safety for the client.

```graphql
{
  findManymessages: db_findManymessages(take: 20, orderBy: [{ id: desc }]) {
    id
    message
    payload {
      extra
    }
    users {
      id
      name
    }
  }
}
```

## Type-Safety for the Client

With everything in place, we're now able to store our custom message extension using a JSON column,
all the while still being able to leverage the GraphQL type system for type-safe field access.

Here's an example snipped how a client can access the `extra` field:

```typescript
<div>
  {messages !== null && messages.length !== 0 && (
    <div>
      {messages.map((message) => {
        return (
          <div key={message.id}>
            <p>
              from: {message.users.name}
              message: {message.message}
              extra: {message.payload.extra}
            </p>
          </div>
        );
      })}
    </div>
  )}
</div>
```

The field `message.payload.extra` in the generated TypeScript client is of type `string`.
If we were not using this approach, `message.payload` would simply be treated as the `any` type.
