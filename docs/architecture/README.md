<div align="center">
  <h1>WunderGraph Architecture</h1>
</div>

<div align="center">
  <img src="../../assets/wundergraph_architecture_comparison.png" height="auto"/>
</div>

## What it takes to build a web application these days

When building a modern web application,
you usually need these 6 ingredients:

1. One or more frontend applications
2. A service to handle authentication (Identity Management)
3. A service to handle files (e.g. S3)
4. One or more Databases
5. One or more Backend Services
6. 3rd party APIs (e.g. Stripe)

The common way of integrating all these is outlined in the diagram above.
All red boxes require heavy involvement of a Developer,
making this stack very expensive and time-consuming to build and maintain.

## Making it easier, but without Vendor lock-in

We've asked ourselves how we can simplify this stack without locking the Developer into specific vendors.
There are Services that call themselves "Backend as a Service".
The problems with those are that they lock you into a specific set of tools and don't integrate well with your existing infrastructure.

The solution to this problem is that we decided to build WunderGraph as a Meta-Framework that relies on abstractions instead of specific implementations.

Here are some examples:

- We didn't re-invent Authentication, we're allowing you to use any OpenID Connect compatible Identity Provider for Authentication.
- We didn't re-invent file uploads, we're integrating with any S3 compatible file storage implementation.
- We didn't create our own custom API Client SDK. We're using GraphQL for the API Layer.
- We didn't build our own way of custom GraphQL protection. We're exposing a JSON-RPC API leveraging JSON-Schema for input validation.
- We didn't re-invent the ORM, we're leveraging Prisma under the hood.
- We didn't re-invent Caching for GraphQL, we're building on top of existing solutions like Cache-Control Headers and ETags.

> The whole is more than the sum of its parts

By not re-inventing all those wheels,
but combining the existing ecosystem in a smart way,
we're able to achieve multiple goals:

- As your WunderGraph application only depends on abstract interfaces,
  we're able to be as vendor-agnostic as possible without giving up on Developer Experience.
- You can start simple! Add a single API to WunderGraph and use the generated Client to add one new component in your Frontend Application.
  No need for a massive migration.
  Add WunderGraph side-by-side to your existing infrastructure

## Never send a human to do a machine's job

Most importantly, we've saving developers from doing a lot of boring repetitive work.
We want developers to do creative, meaningful work.
If we can automate it, we automate it.

Looking back at the second half of the diagram,
you can see that, indeed, we're able to automate a lot of tasks.

## A Hybrid Client-Server Approach

The Client-Server model is one of the fundamental parts of the architecture of the web.
Yet, we see that for certain use-cases, it's actually insufficient.

Pure web clients have issues efficiently fetching data and are more vulnerable to security threats.

With WunderGraph, we've gone the direction of building a hybrid client-server model.
We've moved parts of the logic for authentication and data fetching from the client to the Gateway.
This way, we're still using the client-server model,
but making it more secure and efficient.

## From Serverless to Gateway-less

The basic principle behind Serverless is that Developers don't have to worry about the server.
There obviously still is a server,
but with Serverless,
we don't need to think about hosting or scaling.

We're applying the same principle to API Management, coining the term **"Gateway-less"**.

## Gateway-less API Management

Similar to Serverless, Gateway-less doesn't mean there's no gateway.
It means that we're applying the principles of API Management,
but without having to think about the implementation,
as we've abstracted this layer away.

Configure your DataSources via TypeScript,
write a GraphQL Operation,
use the generated TypeScript SDK from your Frontend Application.

In between, we've just generated an API Gateway for you.
We've compiled the GraphQL Operation into a JSON-RPC endpoint.
We've generated a TypeSafe SDK for you, which wraps all this complexity.
There's still a Gateway, but you don't have to worry about it.

## Developer Experience First

All these efforts are aligned for a single goal, achieving the perfect Developer Experience.
Other API Management tools are packed with features,
but when it comes to "jobs to be done",
they are usually very cumbersome to use.

Not so with WunderGraph.
The Developer Experience is core and center to us.
We're not just adding features,
we always make sure that the Development Workflow works nicely.

## Infrastructure as Code / Configuration as Code

The WunderGraph Gateway (WunderNode) is configured 100% using Code. We believe that TypeScript is the best User
Interface to configure and program your API Gateway.

Our competitors love to claim how you can use their tools without any code.
We believe that configuration is best done using code,
stored in git, automatically versioned and deployed via continuous deployment pipelines.

It's almost impossible to create a great user experience for configuring APIs,
joining disparate DataSources, etc...
But using code, these tasks are actually quite simple and allow you to re-use your "configuration logic".

## Type-Safety everywhere

Type-Safety plays a big role to deliver the perfect Developer Experience. From configuration to API consumption,
everything in WunderGraph is 100% Type-Safe!
By making everything Type-Safe, Developers can use their IDE for suggestions.
Tools like GitHub Copilot improve this experience even further.

## Server-Side GraphQL & JSON-RPC for Client-Server interactions

The fundamental difference between WunderGraph and other GraphQL tooling is that we're not directly exposing the GraphQL API.
Instead, we use GraphQL as a server-side only Execution Layer and expose all GraphQL Operations via JSON-RPC.

This might sound like a big change,
but your workflows actually don't change.
You still write GraphQL Operations and use the auto-generated Type-Safe client.
What's different is that the transport layer is JSON-RPC instead of sending the Operations via HTTP POST.

This greatly benefits [security](https://wundergraph.com/blog/the_complete_graphql_security_guide_fixing_the_13_most_common_graphql_vulnerabilities_to_make_your_api_production_ready) and [performance](https://wundergraph.com/blog/benchmark_apollo_federation_gateway_v1_vs_v2_vs_wundergraph) and allows us to "leverage the platform".
Each Query becomes a unique URL Endpoint,
executed via HTTP GET.
This means, browsers, proxies, CDNs (e.g. Cloudflare,fastly) and Cache servers (e.g. Varnish) can automatically Cache your requests!
