---
title: Authorization - Role Based Access Control (RBAC)
pageTitle: WunderGraph - Features - Authorization - Role Based Access Control (RBAC)
description:
---

Aside from [injecting claims](/docs/features/authorization-injecting-claims) into Operations,
WunderGraph also allows you to protect access to Operations via roles.
This way, you can protect the execution of certain operations for groups of users.

The role based access control implementation is made up of 3 parts.
First, you can define your own set of roles.
Next, you're able to implement a custom hook to assign roles to users.
Finally, the [@rbac](/docs/directives-reference/rbac-directive) directive lets you attach rules to Operations to specify which user is allowed or denied access.

Find below an example of how implementing RBAC with WunderGraph looks like.
By adding a single line of code, using the `@rbac` directive,
you're able to protect the Operation with RBAC.

```graphql
mutation ($email: String!) @rbac(requireMatchAll: [superadmin]) {
  deleteManymessages(where: { users: { is: { email: { equals: $email } } } }) {
    count
  }
}
```

Read more on how to [configure authorization](/docs/wundergraph-config-ts-reference/configure-authorization),
how to [implement the post authentication hook](/docs/wundergraph-server-ts-reference/mutating-post-authentication-hook) to assign roles,
or how to use the [@rbac directive](/docs/directives-reference/rbac-directive) in the reference.
