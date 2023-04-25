---
title: Backend for Frontend
pageTitle: WunderGraph - Backend for Frontend
description:
---

One way to think about WunderGraph is to understand it as an API Gateway,
and you'd be right if you said that.

However, you can also understand WunderGraph as a Backend for Frontend framework.

WunderGraph comes with capabilities that you'd usually expect from an API Gateway,
but that's not the only way to use WunderGraph.

We've found that there's actually a blurred line between the two.
It makes a lot of sense to move cross-cutting concerns,
like authentication, authorization, and so on,
into the API Gateway layer.

At the same time,
for a lot of applications,
you'll also want to use a backend for the frontend (BFF).

You'll usually reach for the BFF pattern if you've got a lot of APIs in the backend,
but only need a subset of them for an application.
In this case,
you'll probably think about building a dedicated backend for this particular application.

The BFF can compose the backend APIs together,
add mappings,
custom middleware,
inject secrets, etc...

## BFFs - the easy way

Building a BFF usually requires you to write a lot of code.
You have to design the BFF API,
glue together the backend APIs,
add mapping functions,
handle security, etc...

With WunderGraph,
this whole process can be automated.
The key is to manage API dependencies in an explicit way.

## Explicitly managing API dependencies

What makes WunderGraph special is that you can manage API dependencies in an explicit way.
Here's a quick example of an application defined using WunderGraph:

```typescript
// wundergraph.config.ts
const weather = introspect.graphql({
  apiNamespace: 'weather',
  url: 'https://weather-api.wundergraph.com/',
});

const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});

configureWunderGraphApplication({
  apis: [weather, countries],
});
```

This code snipped creates a WunderGraph application that depends on two APIs.
They are automatically combined into a single API,
we call it the Virtual Graph.

You're not limited to just GraphQL APIs,
but also databases, like PostgreSQL, MySQL, MongoDB, OpenAPI / REST or even gRPC.

In the second step,
you define GraphQL operations against the Virtual Graph.
Each operation will be compiled into a dedicated API Endpoint,
using WunderGraph's GraphQL to JSON RPC compiler.

So, you've added two API dependencies to your application,
defined a GraphQL Operation,
and WunderGraph automatically generates a JSON RPC API for you.

This, by definition, is already a BFF.
But this is not where we end it.

You can now add custom middleware, simply by writing code.
You might want to call some custom code before or after the GraphQL operation is executed,
that's easy to accomplish.

Additionally,
we also generate a fully type-safe client for your application.
The client knows exactly how to interact with the BFF.
It can handle authentication, api calls and file uploads,
all just by adding some configuration.

## Summary

You can call WunderGraph an API Gateway,
or a Backend for Frontend framework.
Either way, it helps developers achieve their goals faster,
writing less boilerplate code,
relying on WunderGraph to handle the heavy lifting.
