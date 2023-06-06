---
title: Programmable API Gateway
description: Probably the most prominent use case for WunderGraph is to use it as a programmable API Gateway.
---

Probably the most prominent use case for WunderGraph is to use it as a programmable API Gateway.

An API Gateway is a service that allows you to expose your API(s) in a secure way,
and to use it as a proxy for your clients.
API Gateways can have various layers of middleware,
which can be used to add authentication, logging, rate limiting, etc...

The WunderGraph Server (WunderNode) can also be considered an API Gateway,
but a really special one.

What sets WunderGraph apart from other API Gateways is that it's not just an API Gateway.

## API Composition made easy

Usually, if you plug an API into an API Gateway, it'll be secured and everything,
but you're still exposing the same API.

But what if your use case requires you to compose multiple APIs to build a usable product?
Existing Gateway solutions proxy single APIs,
but they're not flexible enough to compose and integrate APIs.

One of the core ingredients of WunderGraph is that you can compose APIs easily.
Instead of having to solve the problem of API composition behind or in front of the Gateway,
we're able to natively support this use case,
keeping your infrastructure and your code clean.

## Beyond just being a proxy

Another differentiator is that WunderGraph doesn't stop at the Gateway level.
If you're composing multiple APIs into a product,
you're able to expose a single,
unified API endpoint to your clients.

Composing such an API will lead to a lot of valuable information,
like endpoints, inputs, response types, authentication & authorization rules, etc...

What usually happens is that this information is encoded into the API Gateway layer,
but then dropped completely.

If you define an endpoint that requires authentication,
your API consumers will usually not have this information.
Clients will behave like they don't know if authentication is required or not.
Although all this information would be available on the API Gateway,
clients also don't know how to authenticate themselves.

That's what we're changing with WunderGraph.
It's not just an API Gateway,
it's an end-to-end solution that gives developers the best possible experience of working with APIs.

Define the API dependencies of your application,
set rules for authentication and authorization,
and WunderGraph generates not just the Gateway configuration,
but also a client that is fully aware of the capabilities of the API.

The generated clients gives you a great developers experience,
because it gives you type safety,
but it also knows how to authenticate your users,
how to upload files,
and implements security best practices,
like automatic CSRF protection for Mutations.

All of this is possible through automation.
The information is available,
you just need to leverage it.

## Customize everything with TypeScript

Finally, we'd like to talk about customization.
To our users, being able to add custom logic to the API Gateway is very important.

Here are some of the use cases we see regularly:

- add custom input validation logic before executing a request
- signing requests based on the user's auth state
- injecting one-time-use tokens into origin requests
- adding custom headers to requests
- rewriting responses
- doing additional requests before executing the actual request

What all of these use cases have in common is that they require developers to be able to add custom logic.
We've looked at ways to make customization super easy for our users.

Our solution to the problem is to run Serverless Hooks side-by-side with your API Gateway.
You're able to customize everything using TypeScript,
but don't have to worry about deployments or scalability.

Both Gateway and Serverless Hooks scale horizontally and can communicate securely in sub-millisecond times.
Your custom logic is also just part of the configuration,
so you don't have to think about bundling,
deployments or anything.

WunderGraph takes your code, deploys it in less than a minute and configures your API Gateway in seconds.
This works on premises, for users concerned about security,
or in the cloud, if you want to use a fully managed service.

Git push, and your Gateway is globally deployed in less than a minute.
Composable APIs, well integrated into your Frontend applications, and easy to use.

That's what we call a programmable API Gateway.
