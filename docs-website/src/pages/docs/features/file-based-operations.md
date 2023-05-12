---
title: File-based Operations
description: Build API Endpoints by writing GraphQL Operations.
---

File-based Operations is a pattern we've adopted from NextJS.
There are many ways to define the Operations of an API.
We've decided to choose a simple approach that developers are familiar with.

The rules are simple:

- Operations must be defined in the folder `.wundergraph/operations`
- Each `.graphql` file becomes an API endpoint.
- Each file should contain exactly one GraphQL Query, Mutation or Subscription.
- Operations can be annotated with `@directives` to adjust their behaviour.
- The file name in front of `.graphql` defines the name of the Operation: `NewPost.graphql` becomes the `NewPost` Operation

That's it, a simple set of constraints that lets you build API Endpoints by writing GraphQL Operations.
If you're interested, read more on how we create the API Endpoints using the GraphQL to JSON RPC compiler.
