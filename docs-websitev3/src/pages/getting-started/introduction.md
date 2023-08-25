---
title: Introduction to WunderGraph
pageTitle: Introduction to WunderGraph
description: ''
hideTableOfContents: true
fullWidthContent: true
---

Hey and welcome to WunderGraph!
I'm Jens, the creator of WunderGraph and I'm super excited to have you here!
Let me give you a quick introduction to WunderGraph and what it can do for you.

## Why WunderGraph?

I'm now working in the software industry for more than 10 years.
What I've seen and experienced is that there's a paradigm shift happening in how we build software.

1. We're moving away from large monolithic applications to smaller, more focused (Micro) Services
2. Everything is connected through APIs
3. "Headless" SaaS products are on the rise, providing off-the-shelf solutions for common problems like Authentication, Payments, Content Management, ERP, etc. in a decoupled way

Overall, this means that we're moving away from the "one size fits all" approach to a modular "best of breed" approach.
This is great, because it allows us to compose our applications from the best available building blocks,
but it also comes with a challenge: **Integration & Composition**.

When previously building monolithic applications, we had a single codebase, a single database and a single deployment.
This approach has its limitations, but we didn't have to worry about integrating different services.

With a modular approach, we have to integrate different services, which means that we have to deal with different APIs, different data formats, different authentication mechanisms, etc...

That's where WunderGraph comes in!
We're introducing a new paradigm: **API Dependency Management**.
Instead of manually composing your application from different APIs and Services,
WunderGraph allows you to define your **API Dependencies** in a declarative way,
as simple as defining a `package.json` file for your NPM dependencies.

## How does it work?

WunderGraph consists of two core components, the **WunderGraph Engine** and the **WunderGraph SDK**.

With the TypeScript SDK, you can define your API Dependencies and add custom logic like authentication, aggregations.
The SDK is inspired by Pulumis approach to Infrastructure as Code and lets you build a unified API in a type-safe way.
It's also responsible for generating client libraries for your API,
so you can easily consume your unified API from your frontend applications.

The **Engine** is a high-performance API Gateway that's responsible for executing your API calls.
It's main purpose is to map your API calls to the underlying APIs and Services,
while taking care of authentication, caching, aggregations, etc...

## How to work with WunderGraph?

Let's break down the workflow of working with WunderGraph.

1. Define your API Dependencies and add custom logic with the WunderGraph SDK. The SDK will generate the unified API for you.
2. Define Operations against the unfied API using GraphQL or TypeScript
3. Consume the unified API using the generated client libraries

## Benefits of using WunderGraph

- Declaratively build an unified API across REST, SOAP, GraphQL, Federation and Databases
- Automatically get client libraries for React, Svelte, Vue, NextJS, Relay, Remix, Expo, etc...
- Get unified Analytics, Monitoring & Tracing across all your APIs

## Conclusion

We've realized that every company is building their own version of WunderGraph in one way or another,
even worse, individual teams within the same company are building multiple versions of WunderGraph in different languages.

By pulling common use cases into a single framework,
we can heavily reduce the amount of code that needs to be written and maintained when it comes to API Integration & Composition.
Instead of starting from scratch and having to deal with all the edge cases,
you can build on top of a strong foundation that's already battle-tested in production.

In addition, you can benefit from the community and the patterns that are emerging around WunderGraph.
Instead of having to figure out how to solve a specific problem,
you can simply ask the community and get help from people that have already solved the problem.

## Want to know more about WunderGraph?

If you're not yet sure what kind of problems WunderGraph can solve for you,
check out [the different use cases](/docs/use-cases) we support,
and the different [features](/docs/features) we provide.
You might also be interested to learn more about the [architecture](/docs/architecture) of WunderGraph.
If you haven't read our [Manifesto](/manifesto) yet, it's a great way to better understand what we're working on and why.

If you've got questions, please [join our Discord community](https://wundergraph.com/discord) or [contact us](https://wundergraph.com/contact/sales).
