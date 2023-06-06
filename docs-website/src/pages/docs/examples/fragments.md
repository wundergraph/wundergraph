---
title: GraphQL Fragments Example
pageTitle: WunderGraph - Examples - GraphQL Fragments
description:
---

GraphQL fragments are a way to reuse selections across multiple Operations.
WunderGraph supports fragments out of the box.

If you want to try out WunderGraph and GraphQL fragments,
[check out the following example](https://github.com/wundergraph/wundergraph/tree/main/examples/fragments).

## Conventions

We have to distinguish two types of fragments.
Not following these conventions will result in errors,
as WunderGraph is not able to resolve the fragments correctly.

### Local Fragments

Fragments can be defined in the same file as the GraphQL Operation.
In this case, the fragment is only available to the "local" Operation.

### Global Fragments

Fragments can also be defined globally in the `.wundergraph/fragments` directory.
In this case, the fragment is available to all Operations.

Global fragments must be named `*.graphql`.
The name of the fragment file is insignificant,
the name of the fragment is.

Example:

```graphql
# UserFragment.graphql
fragment User on User {
  id
  name
}
```

This fragment, although named `UserFragment.graphql`,
is available to all Operations with the name `User`.

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="fragments" /%}
