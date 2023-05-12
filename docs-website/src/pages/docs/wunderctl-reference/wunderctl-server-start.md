---
title: wunderctl server start
description: Start WunderGraph Server in the production mode.
---

The cmd `wunderctl server start` starts WunderGraph Server in the production mode.

{% callout type="warning" %}
`wunderctl server start` not doing any kind of generation.
It is requires generated files from `wunderctl generate`.
{% /callout %}

{% callout type="warning" %}
To run WunderGraph Server it is mandatory to set:

- `nodeUrl` in `WunderNode options`

Alternatively provide values for the following EnvironmentVariable:

- `WG_NODE_URL`

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
