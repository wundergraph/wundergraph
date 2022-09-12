---
title: WunderNode / WunderGraph Server
pageTitle: WunderGraph - Components - WunderNode / WunderGraph Server
description:
---

## WunderNode

WunderNode - is you application server. It mounts api endpoints and serves your application.

Configuration is done via `wundergraph.config.ts`.

## WunderGraph Server

WunderGraph Server - is optinal fastify based server. It is responsible for processing `hooks` and running `Custom GraphQL Servers`.

Configuration is done via `wundergraph.server.ts`.
