---
title: wunderctl up
pageTitle: WunderGraph - wunderctl up
description:
---

The cmd `wunderctl up` is probably the most used command of the WunderGraph cli.
The main purpose is to start the WunderGraph development process.

This involves:

- creating file watchers
- starting the WunderGraph Server / WunderNode
- staring the hooks server
- compiling the configuration files
- compiling the hooks server
- restarting WunderNode and hooks when necessary

{% callout type="warning" %}
When you are using `EnvironmentVariable` in your configuration,
please make sure that you are providing values for them for `wunderctl up` command
{% /callout %}
