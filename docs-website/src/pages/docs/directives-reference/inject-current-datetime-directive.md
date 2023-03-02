---
title: '@injectCurrentDatetime Directive'
pageTitle: WunderGraph - Directives - @injectCurrentDatetime
description:
---

When building APIs,
we often have to deal with dateTime to store information about when a record was created or updated.
A lot of ORMs make it a standard to create `createdAt` and `updatedAt` fields on every table.
You could also add `deletedAt` to implement soft deletes.

If you're already familiar with WunderGraph,
you might know that we're supporting a rich set of Database Management Systems that you can directly connect to WG.
Amongst them are PostgreSQL, MySQL, SQLite, SQLServer and Planetscale.

When dealing with date and time,
we've realised that not all upstreams are capable of creating these values themselves,
so we've had to come up with a solution where these fields can be handled in front of the database or API.

Our solution to the problem is the [@injectCurrentDateTime](/docs/directives-reference/inject-current-datetime-directive) directive.
Attach it to a field and WunderGraph automatically injects the current dateTime into the variable.

Additionally, by attaching the directive to a variable,
the variable is removed from the input variables the user is allowed to supply.
So, the user is no longer allowed to supply the variable,
it's completely server-side generated.

By default, the dateTime String is formatted using the `ISO 8601` definition,
this can be adjusted.

Let's look at an example:

```graphql
mutation ($email: String!, $name: String!, $id: String! @uuid, $createdAt: DateTime! @injectCurrentDateTime) {
  createOneUser(data: { id: $id, email: $email, name: $name, createdAt: $createdAt }) {
    id
    name
    email
    createdAt
  }
}
```

We might also want to be able to update the record later:

```graphql
mutation ($email: String!, $name: String!, $id: String! @uuid, $updatedAt: DateTime! @injectCurrentDateTime) {
  updateOneUser(data: { id: $id, email: $email, name: $name, updatedAt: $createdAt }) {
    id
    name
    email
    createdAt
  }
}
```

You might want to use a different format:

```graphql
mutation (
  $email: String!
  $name: String!
  $id: String! @uuid
  $updatedAt: DateTime! @injectCurrentDateTime(format: UnixDate)
) {
  updateOneUser(data: { id: $id, email: $email, name: $name, updatedAt: $createdAt }) {
    id
    name
    email
    createdAt
  }
}
```

Here's a list of all available formats:

```graphql
enum DateTimeFormat {
  """
  2006-01-02T15:04:05-0700
  """
  ISO8601
  """
  Mon Jan _2 15:04:05 2006
  """
  ANSIC
  """
  Mon Jan _2 15:04:05 MST 2006
  """
  UnixDate
  """
  Mon Jan 02 15:04:05 -0700 2006
  """
  RubyDate
  """
  02 Jan 06 15:04 MST
  """
  RFC822
  """
  02 Jan 06 15:04 -0700
  """
  RFC822Z
  """
  Monday, 02-Jan-06 15:04:05 MST
  """
  RFC850
  """
  Mon, 02 Jan 2006 15:04:05 MST
  """
  RFC1123
  """
  Mon, 02 Jan 2006 15:04:05 -0700
  """
  RFC1123Z
  """
  2006-01-02T15:04:05Z07:00
  """
  RFC3339
  """
  2006-01-02T15:04:05.999999999Z07:00
  """
  RFC3339Nano
  """
  3:04PM
  """
  Kitchen
  """
  Jan _2 15:04:05
  """
  Stamp
  """
  Jan _2 15:04:05.000
  """
  StampMilli
  """
  Jan _2 15:04:05.000000
  """
  StampMicro
  """
  Jan _2 15:04:05.000000000
  """
  StampNano
}
```

If your desired format is not on the list,
you can also use a custom one:

```graphql
mutation (
  $email: String!
  $name: String!
  $id: String! @uuid
  $updatedAt: DateTime! @injectCurrentDateTime(customFormat: "2006-01-02")
) {
  updateOneUser(data: { id: $id, email: $email, name: $name, updatedAt: $createdAt }) {
    id
    name
    email
    createdAt
  }
}
```

## Injecting a datetime into a field

`@injectCurrentDateTime` accepts a second optional `on:` argument that might be used to inject a value into an
specific field. Given the following type:

```graphql
input createUserInput {
  email: String!
  name: String!
  createdAt: DateTime!
}
```

We can use `@injectCurrentDateTime` to set the value of `createdAt` using:

```graphql
mutation ($input: createUserInput! @injectCurrentDateTime(on: "createdAt")) {
  users_Create($input) {
    id
    email
    name
  }
}
```

## Injecting multiple values

`@injectCurrentDateTime` can be used multiple times on the same operation, injecting data into different fields.
Additionally, `@injectCurrentDateTime` can be combined with other directives for injecting or manipulating data
like `@fromClaim`, `@injectEnvironmentVariable`, `@injectGeneratedUUID` and `@jsonSchema`.
