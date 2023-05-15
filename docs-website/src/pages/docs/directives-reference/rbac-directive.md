---
title: '@rbac Directive'
description: Attach RBAC rules to Operations
---

The `@rbac` directive attaches rules for Role Based Access Control (RBAC) to Operations.
Before you're ready to define RBAC rules to Operations, make sure you have [defined the roles already](/docs/wundergraph-config-ts-reference/configure-authorization).

Roles are simply strings, like "admin" or "user", that can be attached to a user.
Then, based on the roles of the user and the rules you've defined,
WunderGraph determines if a user is allowed to execute an Operation.

Find below an annotated Operation showcasing all available options to use the `@rbac` directive.

```graphql
mutation ($email: String!)
@rbac(
  # the user must have all listed roles, "superadmin" and "user"
  requireMatchAll: [superadmin, user]

  # the user must have the role "superadmin"
  requireMatchAll: [superadmin]

  # the user must have one of the roles of "user" or "admin"
  requireMatchAny: [user, admin]

  # the user must not have the role "user"
  denyMatchAll: [user]

  # the user must not have the roles "user" and "admin"
  # it's ok if the user has either the role "user" or the role "admin"
  denyMatchAll: [user, admin]

  # the user must not have the role "user"
  denyMatchAny: [user]

  # the user must not have the role "user" or the role "admin"
  denyMatchAny: [user, admin]
) {
  deleteManymessages(where: { users: { is: { email: { equals: $email } } } }) {
    count
  }
}
```

A common use case is that you want to grant access to an operation explicitly to a single role.
In this case, you'd use the `requireMatchAll` rule like below:

```graphql
mutation ($email: String!) @rbac(requireMatchAll: [superadmin]) {
  deleteManymessages(where: { users: { is: { email: { equals: $email } } } }) {
    count
  }
}
```

By attaching role based access rules to operations,
we're almost done.
What's missing is to actually grant our users certain roles.
For that, we've got to implement a hook, which is [described in the hooks section on authentication](/docs/wundergraph-server-ts-reference/post-authentication-hook).
