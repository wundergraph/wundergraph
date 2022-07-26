---
title: Overview
pageTitle: WunderGraph - Features - Overview
description:
---

Here's an overview of the most important features of WunderGraph.

{% quick-links %}
{% quick-link title="TypeScript Hooks to Customize the API Gateway Middleware" icon="core" href="/docs/features/type-script-hooks-to-customize-the-api-gateway-middleware" description="Hooks are a way to customize the behavior of the API Gateway middleware. We've decided to make hooks as easy to use as possible. No extra service is required to use hooks, it's all TypeScript, everything is type safe." /%}
{% quick-link title="API Namespacing" icon="core" href="/docs/features/api-namespacing" description="When combining multiple APIs, it's inevitable to run into naming collisions, like two schemas define a user type. API Namespacing solves this problem." /%}
{% quick-link title="Cross-API Joins to Compose APIs" icon="core" href="/docs/features/cross-api-joins-to-compose-apis" description="Want to combine data from multiple APIs without writing any custom code? Cross-API Joins are a way to do that." /%}
{% quick-link title="Type-Safe Mocking" icon="core" href="/docs/features/type-safe-mocking" description="Sometimes, you're not able to use the real Origin during testing. You can use Type-Safe Mocking to mock the APIs you need." /%}
{% quick-link title="Local Development" icon="core" href="/docs/features/local-development" description="WunderGraph is and will always be local first, No emulation required." /%}
{% quick-link title="OpenID Connect-Based Authentication" icon="core" href="/docs/features/openid-connect-based-authentication" description="Nobody should build their own authentication system, it's only going to create problems and security risks." /%}
{% quick-link title="Authentication-aware data fetching" icon="core" href="/docs/features/authentication-aware-data-fetching" description="WunderGraph generates smart clients that know if an operation requires authentication or not. That makes the client-side code a lot easier to reason about, and the user experience a lot better." /%}
{% quick-link title="Authorization - Injecting Claims" icon="core" href="/docs/features/authorization-injecting-claims" description="Need to securely inject the user ID or email into a GraphQL Operation? WunderGraph allows you to easily do that with claims injection." /%}
{% quick-link title="Authorization - Role Based Access Control (RBAC)" icon="core" href="/docs/features/authorization-role-based-access-control-rbac" description="We've got built in support for Role Based Access Control (RBAC), which integrates perfectly with your OpenID Connect Provider of choice." /%}
{% quick-link title="Automatic CSRF protection for mutations" icon="core" href="/docs/features/automatic-csrf-protection-for-mutations" description="Have you thought about implementing CSRF protection for mutations? With WunderGraph, it's enabled by default." /%}
{% quick-link title="HTTP Layer Caching" icon="core" href="/docs/features/http-layer-caching" description="You cannot use HTTP-Layer caching for GraphQL, right? Well, with WunderGraph, this works out of the box." /%}
{% quick-link title="GraphQL to JSON-RPC Compiler" icon="core" href="/docs/features/graphql-to-json-rpc-compiler" description="At the core of WunderGraph is the GraphQL to JSON-RPC Compiler, making WunderGraph much more secure than other GraphQL tools and enabling a lot of features." /%}
{% quick-link title="Automatic Content Revalidation with ETags" icon="core" href="/docs/features/automatic-content-revalidation-with-etags" description="WunderGraph automatically revalidates content with ETags, no config required." /%}
{% quick-link title="Realtime Subscriptions" icon="core" href="/docs/features/realtime-subscriptions" description="GraphQL Subscriptions are a nice way to keep your clients up to date with the latest data. WunderGraph supports Subscriptions out of the box, even if you're using Apollo Federation." /%}
{% quick-link title="Live Queries" icon="core" href="/docs/features/live-queries" description="Your backend doesn't support Subscriptions? No problem, WunderGraph supports Live Queries out of the box, turning every API into a realtime API using server-side polling." /%}
{% quick-link title="Generated Clients and SDKs" icon="core" href="/docs/features/generated-clients-and-sdks" description="Why stop at the Gateway level if we can generate clients and SDKs as well? WunderGraph gives you an end-to-end solution, with type-safe clients and SDKs out of the box." /%}
{% quick-link title="JSON Schema Validation" icon="core" href="/docs/features/json-schema-validation" description="Input validation is important to build robust APIs. WunderGraph provides JSON Schema Validation out of the box." /%}
{% quick-link title="Generated APIs for any database" icon="core" href="/docs/features/generated-apis-for-any-database" description="In some cases, you simply want to access your database as easy as possible. WunderGraph provides a way to generate APIs for any database in seconds." /%}
{% quick-link title="File-based Operations" icon="core" href="/docs/features/file-based-operations" description="We've adopted a pattern from Next.js, allowing you to define Operations using a file-based approach." /%}
{% quick-link title="Configuration as Code" icon="core" href="/docs/features/configuration-as-code" description="Everything in WunderGraph is configurable as code, with TypeScript, instead of JSON or YAML." /%}
{% quick-link title="File Uploads to S3-compatible File Storages" icon="core" href="/docs/features/file-uploads-to-s3-compatible-file-storages" description="Need file uploads without any hassle? Plug in your S3 compatible file storage of choice and WunderGraph handles the rest." /%}
{% quick-link title="Custom GraphQL Resolvers" icon="core" href="/docs/features/custom-graphql-resolvers" description="When APIs generated from your database are not enough, you can easily define your own GraphQL Resolvers, keeping clients decoupled from the generated APIs." /%}
{% /quick-links %}
