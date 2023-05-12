---
title: Centralized Governance Monitoring, Access Controls and Logging across your APIs
description: Piping all your APIs, services, databases, and other resources through a single unified API layer allows you to apply security policies, monitoring and logging across all your APIs.
---

Is there a way to be able to apply security policies across different API styles?
Is there a way to apply centralized logging and monitoring across a heterogeneous set of services?

If you're asking these or similar questions,
you've come to the right place.

## Point-to-Point Integrations make centralized governance hard

It's very likely that your organization has a wild zoo of APIs,
with different styles, languages, frameworks, protocols, etc...
We all know this kind of architecture,
it's grown over time and becomes hard to manage.

You might want to get insights into the state of your APIs,
but you've got so many APIs to monitor,
and all of them use different protocols,
so it's really hard to get a single point of view.

Wouldn't it be nice if you could translate them all to a single language,
so that you only need to build a monitoring and logging system once?

Even better,
if all your APIs would speak a single language,
you'd be able to apply security policies and access control across them.

It doesn't matter if the underlying system is Kafka, PostgreSQL or a REST API.
If they could speak the same language,
we'd be able to apply one set of rules,
using the same approach across all of them.

## GraphQL as the universal API Integration Language

With WunderGraph's declarative approach,
it's possible to unify all of your APIs into a single unified GraphQL schema.

We can introspect database tables and generate a GraphQL schema from them.
The same technique can be applied to REST APIs,
and gRPC, and AsyncAPI, Kafka, RabbitMQ and other protocols.

You can automatically introspect all of these and merge them into a single unified GraphQL schema.

But how does this actually work?

## Docker, but for APIs

Before docker existed, applications were not really portable.
You've had to manually install dependencies and install or compile your application.

Docker then introduced a runtime, the Docker Engine,
and a portable format to package applications, called a Docker Image.

With WunderGraph, we're going a similar approach,
but for APIs.

We've created a Runtime, which in case of APIs is simply an API Gateway,
and a configuration language to make APIs portable and composable.

So, as we've explained in the previous section,
you can introspect all your APIs,
and we generate a GraphQL schema from them.
At the same time, we configure the API Gateway so that the Schema becomes executable.

The end result? Although you might have a heterogenous set of APIs, services and databases,
we're able to treat them all the same.

We can apply security policies, logging and monitoring to all of them.
Routing all your traffic through a single API Gateway layer gives you a single pane of glass to monitor and control your APIs.

## Summary

We didn't have to re-invent the wheel to improve the way we integrate APIs.
All the good ideas existed already,
we've just had to apply them to APIs in a smart way.

Using GraphQL is a great way of unifying all your APIs,
it's an easy to learn language,
and it's flexible enough to be used as a facade to any kind of API.
