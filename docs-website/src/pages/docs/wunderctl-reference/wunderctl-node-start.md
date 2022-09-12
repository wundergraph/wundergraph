---
title: wunderctl node start
pageTitle: WunderGraph - wunderctl node start
description:
---

The cmd `wunderctl node start` stars WunderNode in the production mode.

{% callout type="warning" %}
When you are running node in production make sure that mandatory environment variables are provided:

- `WG_LOG_LEVEL`
- `WG_NODE_HOST`
- `WG_NODE_PORT`
- `WG_SERVER_URL`

`wundergraph.config.ts` static values or custom environment variables in options has priority over default environment variables.

{% /callout %}
