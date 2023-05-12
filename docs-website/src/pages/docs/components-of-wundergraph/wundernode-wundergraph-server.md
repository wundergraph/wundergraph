---
title: WunderNode / WunderGraph Server
description: Difference between WunderNode and WunderGraph Server.
---

## WunderNode

WunderNode - is your application server. It mounts api endpoints and serves your application.

Configuration is done via `wundergraph.config.ts`.

## WunderGraph Server

WunderGraph Server - Is an optional server allowing you to extend your WunderNode with TypeScript hooks, webhooks
and Custom GraphQL Resolvers.

Configuration is done via `wundergraph.server.ts`.
