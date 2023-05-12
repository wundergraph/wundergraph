---
title: Apollo Federation support
pageTitle: WunderGraph - Apollo Federation
description: WunderGraph supports Apollo Federation out of the box. You can use WunderGraph as a replacement for any other Federation Gateway.
---

Federation is a concept, built on top of GraphQL, to help companies implement GraphQL at scale.
It brings a lot of useful features to implement Graphs across multiple teams in a "federated" way, hence the name.
It was [invented and specified by Apollo](https://www.apollographql.com/docs/federation/federation-spec/).

## Intro and Guidance on Federation

Are you not sure if Federation is for you?
Do you want to get insights into how you can adopt Federation?
You'd like to learn more about how WunderGraph supports Federation,
especially how Subscriptions work with a federated graph?

Have a look at this [in-depth blog post](https://wundergraph.com/blog/apollo_graphql_federation_with_subscriptions_production_grade_and_highly_scalable),
it should address a lot of your questions.

## WunderGraph as a Federation Gateway replacement

As you've read in the previous section,
thanks to our Ahead-of-Time Compiler,
WunderGraph is extremely fast at executing GraphQL Operations.

While we allow simple DataSources like REST & standard GraphQL,
our compiler and runtime is also capable of resolving federated GraphQL requests.

You can use WunderGraph as a replacement for any other Federation Gateway,
but that's not all.

## Federation with Subscriptions

While other implementations only allow you to execute Queries and Mutations,
WunderGraph also implements Subscriptions.
Here's an [Example](/docs/examples/apollo-federation) if you're interested in trying it out.

## Federation and other APIs

If you're a company with only federated GraphQL APIs, you might be super lucky.
However, in reality you'll always have legacy systems or 3rd party APIs which are not federated GraphQL APIs.
In this case, you'd always have to somehow wrap these APIs or stitch them into your Graphs.

With WunderGraph, it's possible to federate and stitch APIs of any couleur together.
You can easily combine some federated GraphQL services with REST APIs as if they all belonged together.
