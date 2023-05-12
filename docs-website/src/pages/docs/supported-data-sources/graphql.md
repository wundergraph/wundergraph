---
title: GraphQL support
description: WunderGraph is a GraphQL API Gateway that allows you to combine multiple GraphQL APIs into a single endpoint.
---

The GraphQL DataSource allows you to connect any compatible GraphQL Server.
WunderGraph supports Queries, Mutations as well as Subscriptions.

## Upstream Security

To be able to protect your origins, it's possible to inject Headers into upstream requests.
This way, you can add static API keys to upstream requests to prevent bypassing the API exposed by WunderGraph.

As this Data source is HTTP-based, you can also enable mTLS.

## Authorization

For authenticated users, WunderGraph might be making requests on behalf of a user.
You're able to inject claims, or [set headers based on the user's identity](/docs/examples/inject-bearer-token) into the request.
