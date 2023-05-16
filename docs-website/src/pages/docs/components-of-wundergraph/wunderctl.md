---
title: wunderctl
description: The WunderGraph cli, also called wunderctl is the main entry point to use WunderGraph.
---

The WunderGraph cli, also called `wunderctl` is the main entry point to use WunderGraph.
You can generate code with `wunderctl generate`,
and you can use the WunderGraph Hub to manage API dependencies via `wunderctl add` or `wunderctl publish`.

The cli is written in Go, and it's available [in our monorepo](https://github.com/wundergraph/wundergraph).

You might come across a lot of places where we talk about the WunderGraph Server / WunderNode.
When you run `wunderctl up` or `wunderctl start`,
we're actually starting the WunderGraph Server.
So, wunderctl is not just the WunderGraph cli,
but also a wrapper around the WunderGraph Server codebase.
