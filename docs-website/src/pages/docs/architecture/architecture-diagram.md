---
title: Architecture Diagram
description: Explaining the Architecture of WunderGraph.
---

Before we dive into the Architecture of a typical WunderGraph application,
let's first explain how development usually looks like.

## Prerequisites

WunderGraph is configured using the WunderGraph SDK.
Initializing a new WunderGraph project is usually done by running `wunderctl up`.
If you're wondering, wunderctl is the WunderGraph Command Line Interface.

One artifact of running `wunderctl up` is the API Gateway configuration,
which is generated into the `.wundergraph/generated`.

Running `wunderctl up` will not just start the process to continuously generate the API Gateway configuration,
but it also starts the WunderGraph Server / WunderNode in parallel.
When using `up`, the WunderGraph Server will automatically pick up configuration changes.

The second artifact of running `wunderctl up` is the generated client.
You can configure which template to use in the `wundergraph.config.ts` file.
Templates are available, e.g. for TypeScript, React, Go, and many more...

## Explaining the Architecture of WunderGraph

Now that we've got a basic understanding of how the framework works,
let's talk about the components a bit more.

![Architecture Diagram](/images/wundergraph_architecture_simple_overview_dark_transparent.png)

## The WunderGraph Server / WunderNode

The WunderGraph Server is the heart of the WunderGraph framework.
It's the API Gateway of the stack and written in Golang / Go.
The Gateway is highly optimized for performance and scalability.

When starting the WunderGraph server,
it will use our GraphQL to JSON RPC compiler and turn all the GraphQL Operations you've defined into JSON RPC calls.
All of this happens at deployment time,
so we're actually removing GraphQL from the runtime at all.

When you're running in production,
the Gateway is handling requests by calling the pre-compiled, pre-optimized JSON RPC calls.
All aspects like lexing, parsing and validating GraphQL Operations is handled during the deployment,
not during the request execution.

Architecting WunderGraph this way makes it very efficient and secure.
It's possible because we realized that GraphQL Operations usually don't change at runtime.
So, if we're not changing Operations at runtime,
we can turn GraphQL into a compile-time problem,
removing it from the runtime entirely.

## Custom Hooks

Next, we'll talk about the custom hooks that are available in WunderGraph.
When onboarding our first customers,
we've realized that it's important to them to be able to customize the API Gateway logic.

Typical use cases are:

- signing requests to specific origins
- generating one-off auth tokens and injecting them into the request
- mapping requests
- calling external APIs to validate the user's credentials

We wanted to have a solution that feels "native" and doesn't require any additional steps for the user (developer).
Additionally, we wanted to have a solution that will be accepted by the majority of the developers.

For this reason,
we've decided to add native support for custom hooks using TypeScript.
Hooks, as the name indicates, are functions that are called during the request lifecycle.

As an example, the `mutatingPostAuthentication` hook runs after the authentication flow is complete,
allowing you to reject the user, validate them, or add custom claims or roles.

Another useful hook is the `mutatingPreResolve` hook,
which allows you to modify the request before it is resolved.

When you scaffold a new project,
you'll find a `wundergraph.server.ts` file in the `.wundergraph` directory.
This file is the entrypoint to extend the WunderGraph server.

When running `wunderctl up`,
this file gets automatically bundled using `esbuild`,
and executed using Node.js.

Behind the scenes,
we're running a fastify server to run the hooks.
Whenever you make a change to the `wundergraph.server.ts` file,
esbuild will re-compile the bundle and restart the server.
We've invested heavily to make this as fast and easy to use as possible.

## The Virtual Graph

The Virtual Graph, as the name suggests, only virtually exists.
It's a composed GraphQL schema of all the API Dependencies, you've added to your project.

API Dependencies could be DataSources like GraphQL, gRPC, REST, databases like PostgreSQL, MySQL, etc...

The Virtual Graph is generated using the WunderGraph SDK in combination with running `wunderctl up`.
This will automatically introspect all the API Dependencies and generate the Virtual Graph.
Alongside the GraphQL Schema, the process is also generating the `wundergraph.config.json` file.

This file will contain all the information so that the WunderGraph Server / WunderNode can execute GraphQL Operations that should run against the Virtual Graph.

If you'd like to learn more about this topic,
check out the docs on [managing API dependencies explicitly](/docs/architecture/manage-api-dependencies-explicitly).

## The WunderGraph Client

Now that we've covered the backend part, let's talk about the client.

WunderGraph is not just a framework to generate an API Gateway / Backend for Frontend (BFF).
We also generate clients from the same configuration,
giving you a full end-to-end solution,
with no additional tools required.

As you've learned, all configuration happens in the `wundergraph.config.ts` file.
Alongside the backend configuration,
you're also able to define what templates to use to generate the client.

One good example of how a client could look like is TypeScript and Next.js.
As our monorepo is open source, all templates are available for you to use,
and you can easily create your own.

The generated client is based on the WunderGraph RPC Protocol.
This protocol defines how WunderGraph server and the generated client communicate.

The protocol works over HTTP/1.1 and HTTP/2,
supports Queries, Mutations, Subscriptions, Live-Queries, authentication and file uploads.

For React and Next.js, we've also added a separate package to generate hooks with support for Server Side Rendering (SSR) out of the box.

## Summary - putting it all together

The WunderGraph SDK is responsible to configure your application.
The file `wundergraph.config.ts` is the main entrypoint for the configuration.
For customization of the server, you can use `wundergraph.server.ts`.

Once you run `wunderctl up`,
your WunderGraph server is up and running,
behind the scenes, we're generating the configuration for the API Gateway and the client.

Client and server speak JSON RPC over HTTP, defined by the WunderGraph RPC Protocol.

If a client wants to execute an Operation,
it calls an Endpoint on the API Gateway,
which will then execute the pre-compiled Operation against the Virtual Graph.
Both, request and response can be manipulated using hooks.

If you'd like to learn more about the execution flow of a request,
check out the docs on [the request lifecycle](/docs/architecture/wundergraph-explained-in-one-sequence-diagram).
