---
title: '@injectGeneratedUUID Directive'
pageTitle: WunderGraph - Directives - @injectGeneratedUUID
description:
---

When creating new object in a database, it's common to use an incremental number as the primary key.
However, sometimes it's preferred to generated unique IDs instead of letting the database decide on an id.

To solve this problem,
a lot of developers reach to `UUID`, a method of creating unique IDs.
Some systems, like PostgreSQL support UUID natively,
other have to rely on a service to generate the UUIDs for them.

To make using UUIDs as convenient in WunderGraph as possible,
we've created the `@injectGeneratedUUID` directive.

Simply attach it to a variable definition and WunderGraph automatically injects a UUID into the string,
all server-side, so the client cannot temper it.

Additionally, by attaching the `@injectGeneratedUUID` directive to a variable definition,
the variable is removed from the input variables,
disallowing the user to use it.

Let's look at an example for a user sign up:

```graphql
mutation ($email: String!, $name: String!, $id: String! @injectGeneratedUUID) {
  createOneuser(data: { id: $id, email: $email, name: $name }) {
    id
    name
    email
  }
}
```

The user is allowed to enter their email and name while the WunderGraph Server injects the `$id` variable.
This works independently of the upstream.
You could use this with a database or API.
