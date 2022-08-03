---
title: wunderctl init
pageTitle: WunderGraph - wunderctl init
description:
---

The cmd `wunderctl init` is used to initialize a new WunderGraph project.
By default, it's using a headless template,
meaning that it's not using any frontend framework.

## Available templates

### WunderGraph & Next.js

```shell
wunderctl init --template=nextjs-starter
```

### WunderGraph & Next.js & PostgreSQL

```shell
wunderctl init --template=nextjs-postgres-starter
```

### Publish your API to WunderHub

Use this template to easily publish an API to WunderHub.

```shell
wunderctl init --template=publish-api
```
