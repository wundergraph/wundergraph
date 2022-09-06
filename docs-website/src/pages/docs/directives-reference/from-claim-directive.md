---
title: '@fromClaim Directive'
pageTitle: WunderGraph - Directives - @fromClaim
description:
---

WunderGraph builds on top of OpenID Connect for authentication.
When a user is authenticated,
we're storing all their claims in a cookie.

When defining your GraphQL Operations,
you're able to use the `@fromClaim` directive to access the claims of the user and inject them into variables.

Here's an example:

```graphql
mutation (
  $userId: String! @fromClaim(name: USERID)
  $name: String! @fromClaim(name: NAME)
  $email: String! @fromClaim(name: EMAIL)
  $message: String! @jsonSchema(pattern: "^[a-zA-Z 0-9]+$")
) {
  createOnepost(
    data: {
      message: $message
      user: {
        connectOrCreate: {
          where: { email: $email }
          create: { email: $email, name: $name, userID: $userID }
        }
      }
    }
  ) {
    id
    message
    user {
      id
      name
    }
  }
}
```

We're injecting the `name` and `email` claims into the `$name` and `$email` variables.
The variables are removed from the exported JSON RPC API.
This means, the user cannot set them manually,
JSON Schema validation would prevent this automatically.

Additionally, applying the `@jsonSchema` directive to an operation will automatically enable an authentication check.
So, the user must be authenticated to execute the operation.
