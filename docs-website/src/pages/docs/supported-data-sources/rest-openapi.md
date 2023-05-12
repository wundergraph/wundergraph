---
title: REST/OpenAPI support
description: WunderGraph is the easiest way to expose REST APIs through GraphQL.
---

REST is the most commonly used style to build APIs.
We're not trying to discuss the pros and cons of REST APIs here.
REST APIs are everywhere. Your own applications might probably rely on some REST APIs.

If you'd like to use GraphQL,
you're most likely in a situation where you need to glue some REST APIs to your shiny new GraphQL API.
You could write a wrapper or adapter of any sort and eat the REST API up by the GraphQL API.
However, that would mean you have to write, test, maintain and deploy extra code.

With WunderGraph, you're able to turn any REST API specified by an OpenAPI Specification into a GraphQL API.
This way, you can treat it like any other GraphQL API and even stitch it together with other APIs.

We don't think that GraphQL is a replacement for REST.
REST makes it very easy to implement APIs.
On the other hand,
consuming REST APIs is not always that easy.

## REST and GraphQL

Combining REST APIs with WunderGraph gives you the best of both worlds.
Get the amazing developer experience of using GraphQL in the client,
together with the simplicity of writing REST APIs.

## Reference

If you want to learn more on how to use the OpenAPI- / REST Datasource,
head over to the [Reference Documentation](/docs/wundergraph-config-ts-reference/configure-openapi-rest-data-source).
