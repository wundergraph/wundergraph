---
title: Authorization - Injecting Claims
description: Injecting Claims into GraphQL Operations
---

One of our most powerful features is the ability to inject Claims into GraphQL Operations.

If you're not familiar with the term Claims, it's from the OpenID Connect specification.
Claims are name value pairs of information about a user, like their name, email, etc...

Let's say, you'd like to create an operation that allows users to create a Post.
There are a few requirements that need to be met to implement this:

- users must be authenticated
- we need a unique identifier for each user
- the operation needs to be secure
- we want to be able to trust the identity of the user
- if the user doesn't yet exist, we want to be able to create it

All of this logic can be expressed as a single GraphQL Operation.

```graphql
mutation (
  $name: String! @fromClaim(name: NAME)
  $email: String! @fromClaim(name: EMAIL)
  $message: String! @jsonSchema(pattern: "^[a-zA-Z 0-9]+$")
) {
  createOnepost(
    data: {
      message: $message
      user: { connectOrCreate: { where: { email: $email }, create: { email: $email, name: $name } } }
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

By using the `@fromClaim` directive, we're enforcing three things.
First, we're requiring the user to be authenticated using OpenID Connect.
Second, we'll disallow the user to use the field `name` on the variables object, so they cannot manipulate the input.
Third, we inject the Claim value for the field `name` into the variables.
For the variable `email`, we're doing the same. `message` is using `@jsonSchema` directive.

As you can see, you can save yourself a lot of time using these powerful directives.
If you want to learn more, have a look at the `@fromClaim` reference.
