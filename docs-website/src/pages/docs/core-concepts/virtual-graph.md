---
title: Virtual Graph
description: The Virtual Graph is a concept to represent your composed virtual Graphs.
---

The Virtual Graph is a concept we've introduced in WunderGraph.
It's the idea of combining multiple GraphQL Schemas into a single, unified, schema.
As we're using a JSON RPC compiler instead of directly exposing the GraphQL,
we're calling this concept the "Virtual Graph".

The Virtual Graph is only really available during development.
But when deploying to production,
the GraphQL to JSON RPC compiler will automatically turn all defined GraphQL Operations into JSON RPC Endpoints.
That's why this Graph really only exists virtually, hence the name.

What's so powerful about having a concept like the Virtual Graph is that it enables you to think explicitly about APIs as dependencies.
The Virtual Graph is your gateway to the other APIs you want to use.
With this idea in mind, you can understand GraphQL as the language to "program" with APIs.

Add API dependencies to your WunderGraph application and use GraphQL to define your API surface.
The Virtual Graph allows you to meta-program your APIs with GraphQL.
The artifact will be an API Gateway and one or more generated clients,
speaking JSON RPC over HTTP between the them.
