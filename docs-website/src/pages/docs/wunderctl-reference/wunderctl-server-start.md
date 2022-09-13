---
title: wunderctl server start
pageTitle: WunderGraph - wunderctl server start
description:
---

The cmd `wunderctl server start` starts WunderGraph Server in the production mode.

{% callout type="warning" %}
When you are running node in production make sure that mandatory environment variables are provided:

- `WG_NODE_URL`

`wundergraph.server.ts` static values or custom environment variables in [`options`](/docs/wundergraph-config-ts-reference/configure-wundernode-options) has priority over default environment variables.

{% /callout %}
