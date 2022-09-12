---
title: wunderctl generate
pageTitle: WunderGraph - wunderctl generate
description:
---

WunderGraph uses a lot of code generation to give you not just type-safe APIs,
but also type-safe configuration.
We introspect your WunderGraph configuration and generate all the necessary code for you.

You can either to this concurrently in the background,
using `wunderctl up`,
or you also do it on demand using `wunderctl generate`.

{% callout type="warning" %}
When you are generating your production config please make sure that you have provided all the necessary environment variables:

- `WG_LOG_LEVEL`
- `WG_NODE_URL`
- `WG_NODE_HOST`
- `WG_NODE_PORT`
- `WG_SERVER_URL`
- `WG_SERVER_HOST`
- `WG_SERVER_PORT`

Alternatively provide a static options in `wundergraph.config.ts` and if you use WunderGraph Server in `wundergraph.server.ts`.

In case you are using custom environment variables you should also provide them for `wunderctl generate` command
{% /callout %}
