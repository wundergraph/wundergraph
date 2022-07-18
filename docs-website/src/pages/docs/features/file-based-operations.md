---
title: File-based Operations
pageTitle: WunderGraph - Features - File-based Operations
description:
---

File-based Operations is a pattern we've adopted from NextJS.
There are many ways to define the Operations of an API.
We've decided to choose a simple approach that developers are familiar with.

The rules are simple:

- Operations must be defined in the folder `.wundergraph/operations`
- Each `.graphql` file becomes an API endpoint.
- Each file should contain exactly one GraphQL Query, Mutation or Subscription.
- Operations can be annotated with [@directives](/docs/directives-reference) to adjust their behaviour.
- The file name in front of `.graphql` defines the name of the Operation: `NewPost.graphql` becomes the `NewPost` Operation

That's it, a simple set of constraints that lets you build API Endpoints by writing GraphQL Operations.
If you're interested, read more on [how we create the API Endpoints](/docs/features/graphql-to-json-rpc-compiler).
