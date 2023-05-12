---
title: Versionless APIs - Easily build backwards compatible APIs
description: Enable versionless APIs to keep APIs backwards compatible, while being able to continuously change your API design.
---

Versioning is a very common problem when building APIs.
It's not always easy to manage versioning, and it's not always easy to manage backwards compatibility.
You first have to understand when and what to version,
so you need to know if you're breaking any client if you're making a change.

Once you're aware of the breaking change,
you need to implement a way to version your API.
Finally, you have to implement a way of notifying your API consumers about the change,
so they can update their clients.

While this is a big cost,
it's often necessary and important,
because you want to move forward and improve your APIs.
What was a good API design on day one is no longer valid,
because you've learned from your API consumers and want to improve your API design.

## Versionless APIs allow you to keep APIs backwards compatible, while being able to continuously change your API design

What if you didn't have to think about backwards compatibility at all?
What if you were free to change your API design at any time,
without breaking clients?

That's what we enable with WunderGraph and the concept of "Versionless APIs".
Versionless APIs allow you to continuously evolve your API design without breaking clients.

### How it works

When composing multiple API dependencies into a single API,
we call this creating a Virtual Graph.
Virtual Graph, because it doesn't really exist, only virtually.
It's a virtual composition of the API dependencies,
a GraphQL Schema that is composed of all your APIs.

Once this virtual Graph is composed,
you can define GraphQL Operations to interact with it,
e.g. Queries and Mutations.

For each GraphQL Operation,
WunderGraph will generate a dedicated API Endpoint on the API Gateway,
alongside with a type-safe client using one of the templates provided by WunderGraph.

When generating the client,
we're able to encode into the client when it was created,
and what version of the API it was created for.

When this client makes requests to the API Gateway,
the API Gateway will always know what version of the API the client understands.

WunderGraph is now able to collect analytics data about API usage,
keeping a record of what API clients exist,
what versions and Operations they use.

With this information,
it's possible to compute the effects of breaking changes on existing active clients.

If you change one of the origin services,
e.g. a REST API, the schema of a database, etc...,
you can generate how the virtual graph will change.

With the changed schema of the virtual graph,
you're able to identify which clients will no longer be able to use the API.

At this point,
we're able to prevent this change from getting deployed in a continuous integration pipeline.
That's great to prevent breaking changes,
but what if you want to make changes without breaking clients?

### Deploy breaking changes without breaking clients

Instead of just preventing breaking changes,
we're also able to deploy breaking changes without breaking clients.
Here's how it works:

When you're about to deploy a breaking change,
you can use `wunderctl generate` to analyze if you're about to break any client with a change.

If such a scenario is detected,
`wunderctl generate` will scaffold a `migration` function for you to implement,
alongside with a testsuite.

When implementing the `migration` function,
the WunderGraph API Gateway will automatically call this function if an "old" client is detected.
The request from the old client will be "migrated" to be compatible to the new API.
Once the response comes back, the response function of the migration will be called,
allowing you to map the response of the new API to be compatible with the old client.

The generated testsuite will make it easy for you to test the migration function.
Once all tests go green,
you can be 100% sure that old clients are still compatible with the new API.

## Conclusion

Versionless APIs doesn't mean that we don't version APIs anymore.
It just means that we can continue to evolve APIs without breaking clients.

But most importantly,
with this feature,
we're taking away the mental burden of having to think about versioning at all.

Configure what clients you'd like to support,
e.g. clients that talked to the API Gateway within the last 2 months,
run `wunderctl generate`,
and then implement the `migration` functions.

Once your migration testsuite is green,
you can deploy your updated API without breaking any clients.
