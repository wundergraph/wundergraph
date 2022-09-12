---
title: wunderctl server start
pageTitle: WunderGraph - wunderctl server start
description:
---

The cmd `wunderctl server start` stars WunderGraph Server in the production mode.

{% callout type="warning" %}
When you are running node in production make sure that mandatory environment variables are provided:

- `WG_LOG_LEVEL`
- `WG_SERVER_HOST`
- `WG_SERVER_PORT`
- `WG_NODE_URL`

`wundergraph.server.ts` static values or custom environment variables in options has priority over default environment variables.

{% /callout %}
