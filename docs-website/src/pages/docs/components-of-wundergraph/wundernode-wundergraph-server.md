---
title: WunderNode / WunderGraph Server
pageTitle: WunderGraph - Components - WunderNode / WunderGraph Server
description:
---

## WunderNode

WunderNode - is you application server. It mounts api endpoints and serves your application.

Configuration is done via `wundergraph.config.ts`.

## WunderGraph Server

WunderGraph Server - Is optional server allowing you to extend your WunderNode with hooks,
[webhooks](/docs/features/type-script-webhooks-to-integrate-third-party-applications)
and [Custom GraphQL Resolvers](/docs/features/custom-graphql-resolvers).

Configuration is done via `wundergraph.server.ts`.
