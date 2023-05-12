---
title: WunderGraph Client
description: The WunderGraph client is a client that is generated for a specific project.
---

When we talk about the WunderGraph client,
what we usually mean is a client that is generated for a specific project.

WunderGraph is an end-to-end solution that combines the patterns API Gateway,
Backend for Frontend (BFF) and API Client.

We've got multiple client templates, e.g. for React, Next.js, and more,
which can be used to generate clients.

When you configure your WunderGraph project,
`wunderctl up` will automatically generate the configuration for the WunderGraph Server / WunderNode,
run the Server, and generate an equivalent client that works hand-in-hand with the Server.

You can define your own client templates by looking at the WunderGraph Protocol and implementing the Template interface of the SDK.
A good reference point for implementing a client template is the [Next.js package](https://github.com/wundergraph/wundergraph/tree/main/packages/nextjs).
