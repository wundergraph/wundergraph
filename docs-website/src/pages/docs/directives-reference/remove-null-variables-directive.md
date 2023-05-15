---
title: '@removeNullVariables Directive'
description: Remove null variables from GraphQL Query or Mutation Operations
---

The `@removeNullVariables` directive allows you to remove variables with null or empty object value from your GraphQL Query or Mutation Operations.

A potential use-case could be that you have a graphql upstream which is not accepting null values for variables.
By enabling this directive all variables with null values will be removed from upstream query.

```graphql
query ($say: String, $name: String) @removeNullVariables {
  hello(say: $say, name: $name)
}
```

The directive `@removeNullVariables` will transform variables json and remove top level null values.

```json
{ "say": null, "name": "world" }
```

So upstream will receive the following variables:

```json
{ "name": "world" }
```

The same way empty objects could be removed:

```json
{ "say": {}, "name": "world" }
```

So upstream will receive the following variables:

```json
{ "name": "world" }
```
