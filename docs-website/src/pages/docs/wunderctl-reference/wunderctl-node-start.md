---
title: wunderctl node start
pageTitle: WunderGraph - wunderctl node start
description:
---

The cmd `wunderctl node start` starts WunderNode in the production mode.

{% callout type="warning" %}
When you are running node in production make sure that mandatory environment variables are provided:

- `WG_SERVER_URL`

`wundergraph.config.ts` static values or custom environment variables in [`options`](/docs/wundergraph-server-ts-reference/configure-wundergraph-server-options) has priority over default environment variables.

{% /callout %}
