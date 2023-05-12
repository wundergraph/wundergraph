---
title: wunderctl up
description: Start the WunderGraph development process.
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
When you are using custom `EnvironmentVariable` in your configuration,
please make sure that you are providing values for them when running this command
{% /callout %}
