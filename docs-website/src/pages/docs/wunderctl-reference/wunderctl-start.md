---
title: wunderctl start
description: Start WunderNode and WunderGraph Server together in a single process.
---

The cmd `wunderctl start` starts WunderNode and WunderGraph Server together in a single process.

The main purpose is to simplify running all WunderGraph components in production mode.
To start the development process you should use `wunderctl up` instead.

{% callout type="warning" %}
`wunderctl start` not doing any kind of generation.
It is requires generated files from `wunderctl generate`.
{% /callout %}

{% callout type="warning" %}
For the production it is mandatory to set:

- `nodeUrl` in `WunderNode options`
- `serverUrl` in `WunderGraph Server options`

Alternatively provide values for the following environment variables

- `WG_NODE_URL`
- `WG_SERVER_URL`

{% /callout %}

{% callout type="warning" %}
Despite the fact that `wunderctl start` is sufficient for simple use cases.

We highly recommend launching WunderNode and WunderGraph Server separately in order to allow scaling both components independently

To accomplish that please use following commands:

- `wunderctl node start` to start WunderNode
- `wunderctl server start` to start WunderGraph Server

{% /callout %}

{% callout type="warning" %}
When you are using custom `EnvironmentVariable` in your configuration,
please make sure that you are providing values for them when running this command
{% /callout %}
