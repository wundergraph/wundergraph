---
title: '@internalOperation Directive'
description: Mark an operation as internal
---

{% callout type="warning" %}
This directive is deprecated. Operations are now automatically marked internal when inside a directory named _internal_ (even if nested).
{% /callout %}

The `@internalOperation` directive marks an Operation as internal.
The Operation will no longer be accessible from the public API.
It can only be used from internal hooks.

Keep in mind that all operations are available to the hooks.
However, internal Operations are exclusively accessible from the hooks environment.

## Purpose

The idea behind the `@internalOperation` directive is to support scenarios where side effects are needed.
E.g. after the user logs into the system, you'd like to create a record for them or update the lastLogin field.
In this scenario, you're able to accomplish this easily without exposing the mutation to the public API surface.

Other use cases could be that you want to determine if a user is eligible to execute a query or mutation.
You could look up in a system if they are allowed to make an action.

## Example

This is an example where we upsert the user after a successful login.
Upsert means, we create a user object if it doesn't exist yet.
If the user exists already, we update the lastLogin field.

```graphql
# UpsertLastLogin.graphql
mutation ($email: String!, $name: String!, $now: DateTime! @injectCurrentDateTime) @internalOperation {
  upsertOneusers(
    where: { email: $email }
    update: { lastlogin: { set: $now } }
    create: { lastlogin: $now, email: $email, name: $name }
  ) {
    id
    lastlogin
  }
}
```

Once this mutation is defined,
it can be used from within the hooks configuration.
Call `client.mutations` and the name of the mutation to execute it.
That's it, no need to add an ORM, or instantiate a database connection from within the hooks.
WunderGraph can handle all the complexity of making all Operations available to the hooks environment.

```typescript
// wundergraph.server.ts
const server = configureWunderGraphServer(() => ({
  hooks: {
    authentication: {
      postAuthentication: async (user) => {
        if (!user.email || !user.name) {
          return;
        }
        await client.mutations.UpsertLastLogin({
          email: user.email,
          name: user.name,
        });
      },
    },
    queries: {},
    mutations: {},
  },
}));
```

## Conclusion

As you've learned in this section,
WunderGraph makes it very easy to make Operations available as typesafe function calls to your hooks environment.
Using the `@internalOperation` you're able to hide Operations from the public API.
