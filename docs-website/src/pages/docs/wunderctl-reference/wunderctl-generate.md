---
title: wunderctl generate
description: Generate the WunderGraph configuration and code generation.
---

WunderGraph uses a lot of code generation to give you not just type-safe APIs,
but also type-safe configuration.
We introspect your WunderGraph configuration and generate all the necessary code for you.

You can either to this concurrently in the background,
using `wunderctl up`,
or you also do it on demand using `wunderctl generate`.

{% callout type="warning" %}
When you do not provide an options in `wundergraph.config.ts` and/or in `wundergraph.server.ts`.
We will use Default Environment Variables to generate the config.

For the production it is mandatory to set:

- `nodeUrl` in `WunderNode options`
- `serverUrl` in `WunderGraph Server options`

Alternatively provide values for the following environment variables

- `WG_NODE_URL`
- `WG_SERVER_URL`

{% /callout %}

{% callout type="warning" %}
When you are using custom `EnvironmentVariable` in your configuration,
please make sure that you are providing values for them when running this command
{% /callout %}
