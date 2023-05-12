---
title: GraphQL to JSON-RPC Compiler
description: How WunderGraph compiles GraphQL Operations to JSON-RPC
---

The most obvious advantage of GraphQL is that you can query exactly the data you want.
The most obvious disadvantage is that you can query exactly the data you want.

On the one hand, being a query language, GraphQL gives us a lot of flexibility.
At the same time, this opens up numerous attack angles.

Attackers could ask for super complex queries, ask for too much data, traverse the Graph in ways they shouldn't be allowed to, etc..

There's a myriad of ways to solve these problems. You can find numerous npm packages, trying to solve the problem.
API Gateways try to do their best to combat the issue.
A lot of effort is put into making this less a threat.

It's good that people try to solve the problem, but maybe they're focussing on the wrong approach?
Why secure something which should have never been insecure at all?

## History of GraphQL

If you look at the history of GraphQL, you'd learn that the inventors of GraphQL didn't just create the query language.
They've also created a compiler and a very smart client (Relay) which makes using GraphQL a lot more convenient.

In that sense, Facebook never directly exposed their GraphQL APIs in production.
During development, it was ok to write arbitrary Queries, but all Operations would be persisted at compile time.

This didn't just increase performance, it also meant that the public facing API would be a lot more secure.

## Building on top of giants

We didn't want to recreate the wheel.
We didn't even try to solve all the edge cases to make GraphQL secure.
We took our learnings and took "persisted Queries" to the next level.

In a nutshell, it works like this. If you write a Query like the one below:

```graphql
query TopProducts {
  topProducts {
    upc
    name
    price
  }
}
```

WunderGraph automatically builds an endpoint on your local dev environment which you could curl like this:

```shell
curl http://localhost:9991/operations/TopProducts
```

Write any Query/Mutation/Subscription during development.
At runtime it's just JSON-RPC.
Some might call this REST-ish, but we don't want to open up this discussion here.
It's simply JSON over RPC.

No GraphQL at runtime. Problem solved!

We could have called it a day.
But then you would have probably said something like:
Hey! That's just persisted queries as a service.
Nothing new, boring.

You would have been right.
We do a lot more than just persisted queries and JSON-RPC:

- turn any persisted Query into a Live-Query to keep the UI updated as new data becomes available
- generate a [typesafe client](/docs/features/generated-clients-and-sdks) for all Operations
- generate typesafe [Mocks](/docs/features/type-safe-mocking) for all Operations
- [authentication aware](/docs/features/authentication-aware-data-fetching) data fetching
- automatic content [revalidation](/docs/features/automatic-content-revalidation-with-etags)

You've now learned a lot about the internals of WunderGraph.
You understand how we turn GraphQL Operations into JSON-RPC.
You also know how we add Caching on top of all of this.

If we're talking about caching, it's always important to talk about cache invalidation as well.
Let's head over to the next section.
