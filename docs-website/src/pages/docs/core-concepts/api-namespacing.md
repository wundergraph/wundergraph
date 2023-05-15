---
title: API Namespacing
description: API Namespacing allows you to merge multiple APIs into a single unified API.
---

When we were building the initial version of WunderGraph,
we wanted to be able to merge multiple services together into a single unified API.
As you might already know,
this feature is now available for quite some time,
we call it the Virtual Graph.

While building this feature, we've realized early on that we're running into a problem.
When you generate GraphQL Schemas from REST APIs, multiple databases,
GraphQL and other APIs,
you're very likely to run into naming collisions.

Naming collisions occur when multiple APIs use the same name for fields and types,
but mean a different thing.
E.g. two APIs could have a `type User` or a `user` field on the Query type.

Initially, we were thinking of solving this problem by allowing users to rename fields and types.
However, we've decided against this approach because it doesn't really scale and is very inconvenient.
Whenever you add an API dependency that creates a conflict, you'd have to manually fix the problem.

Instead, we've invented a way to automatically solve the problem: API Namespacing.

Here's a simple example:

```typescript
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});
```

When introspecting the SpaceX API,
we'll put it in the `spacex` namespace.
This means that all root fields and types will be prefixed with `_spacex`.

When executing a GraphQL Operation against this API,
the WunderGraph engine will automatically "un-namespace" the fields and types,
otherwise the origin would be incompatible.

With this feature in place,
you can add any number of APIs to the same Virtual Graph,
and you'll never run into naming collisions.
