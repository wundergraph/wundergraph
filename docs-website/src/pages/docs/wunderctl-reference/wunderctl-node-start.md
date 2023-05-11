---
title: wunderctl node start
description: Start WunderNode in the production mode.
---

The cmd `wunderctl node start` starts WunderNode in the production mode.

{% callout type="warning" %}
`wunderctl node start` not doing any kind of generation.
It is requires generated files from `wunderctl generate`.
{% /callout %}

{% callout type="warning" %}
When you have WunderGraph Server in your setup.
It is mandatory to set:

- `serverUrl` in `WunderGraph Server options`

Alternatively provide values for the following EnvironmentVariable:

- `WG_SERVER_URL`

{% /callout %}

{% callout type="warning" %}
Static values or custom environment variables has priority over default environment variables in:

- `WunderNode options` of `wundergraph.config.ts`
- `WunderGraph Server options` of `wundergraph.server.ts`

{% /callout %}

{% callout type="warning" %}
When you are using custom `EnvironmentVariable` in your configuration,
please make sure that you are providing values for them when running this command
{% /callout %}
