---
title: Overview
pageTitle: WunderGraph - Features - Overview
description:
---

Here's an overview of the most important features of WunderGraph.

## [TypeScript Hooks to Customize the API Gateway Middleware](/docs/features/type-script-hooks-to-customize-the-api-gateway-middleware)

Hooks are a way to customize the behavior of the API Gateway middleware.
We've decided to make hooks as easy to use as possible.
No extra service is required to use hooks,
it's all TypeScript,
everything is type safe.

## [API Namespacing](/docs/features/api-namespacing)

When combining multiple APIs, it's inevitable to run into naming collisions,
like two schemas define a user type.
API Namespacing solves this problem.

## [Cross-API Joins to Compose APIs](/docs/features/cross-api-joins-to-compose-apis)

Want to combine data from multiple APIs without writing any custom code?
Cross-API Joins are a way to do that.

## [Type-Safe Mocking](/docs/features/type-safe-mocking)

Sometimes, you're not able to use the real Origin during testing.
You can use Type-Safe Mocking to mock the APIs you need.

## [Local Development](/docs/features/local-development)

WunderGraph is and will always be local first,
No emulation required.

## [OpenID Connect-Based Authentication](/docs/features/openid-connect-based-authentication)

Nobody should build their own authentication system,
it's only going to create problems and security risks.

WunderGraph acts as an OpenID Connect Relying Party,
so you can delegate authentication to any OIDC provider and integrate them with WunderGraph in minutes.

## [Authentication-aware data fetching](/docs/features/authentication-aware-data-fetching)

WunderGraph generates smart clients that know if an operation requires authentication or not.
That makes the client-side code a lot easier to reason about,
and the user experience a lot better.

## [Authorization - Injecting Claims](/docs/features/authorization-injecting-claims)

Need to securely inject the user ID or email into a GraphQL Operation?
WunderGraph allows you to easily do that with claims injection.

## [Authorization - Role Based Access Control (RBAC)](/docs/features/authorization-role-based-access-control-rbac)

We've got built in support for Role Based Access Control (RBAC),
which integrates perfectly with your OpenID Connect Provider of choice.

## [Automatic CSRF protection for mutations](/docs/features/automatic-csrf-protection-for-mutations)

Have you thought about implementing CSRF protection for mutations?
With WunderGraph, it's enabled by default.

## [HTTP Layer Caching](/docs/features/http-layer-caching)

You cannot use HTTP-Layer caching for GraphQL, right?
Well, with WunderGraph, this works out of the box.

## [GraphQL to JSON-RPC Compiler](/docs/features/graphql-to-json-rpc-compiler)

At the core of WunderGraph is the GraphQL to JSON-RPC Compiler,
making WunderGraph much more secure than other GraphQL tools and enabling a lot of features.

## [Automatic Content Revalidation with ETags](/docs/features/automatic-content-revalidation-with-etags)

WunderGraph automatically revalidates content with ETags,
no config required.

## [Realtime Subscriptions](/docs/features/realtime-subscriptions)

GraphQL Subscriptions are a nice way to keep your clients up to date with the latest data.
WunderGraph supports Subscriptions out of the box,
even if you're using Apollo Federation.

## [Live Queries](/docs/features/live-queries)

Your backend doesn't support Subscriptions?
No problem, WunderGraph supports Live Queries out of the box,
turning every API into a realtime API using server-side polling.

## [Generated Clients and SDKs](/docs/features/generated-clients-and-sdks)

Why stop at the Gateway level if we can generate clients and SDKs as well?
WunderGraph gives you an end-to-end solution, with type-safe clients and SDKs out of the box.

## [JSON Schema Validation](/docs/features/json-schema-validation)

Input validation is important to build robust APIs.
WunderGraph provides JSON Schema Validation out of the box.

## [Generated APIs for any database](/docs/features/generated-apis-for-any-database)

In some cases, you simply want to access your database as easy as possible.
WunderGraph provides a way to generate APIs for any database in seconds.

## [File-based Operations](/docs/features/file-based-operations)

We've adopted a pattern from Next.js,
allowing you to define Operations using a file-based approach.

## [Configuration as Code](/docs/features/configuration-as-code)

Everything in WunderGraph is configurable as code,
with TypeScript, instead of JSON or YAML.

## [File Uploads to S3-compatible File Storages](/docs/features/file-uploads-to-s3-compatible-file-storages)

Need file uploads without any hassle?
Plug in your S3 compatible file storage of choice and WunderGraph handles the rest.

## [Custom GraphQL Resolvers](/docs/features/custom-graphql-resolvers)

When APIs generated from your database are not enough,
you can easily define your own GraphQL Resolvers,
keeping clients decoupled from the generated APIs.
