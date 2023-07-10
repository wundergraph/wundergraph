---
title: 'Deploy with Docker'
pageTitle: WunderGraph - Deploy with Docker
description: How to deploy WunderGraph with Docker
---

WunderGraph can be deployed using Docker.
An example WunderGraph project for deploying with Docker can be found [here](https://github.com/wundergraph/docker).

## Dockerfile

The most recent example Dockerfile that can be used as a starting point for your project can be found
[here](https://github.com/wundergraph/docker/blob/main/Dockerfile).

## Test

```bash
# Install your project to generate a lockfile
npm i
# Build the docker image
docker build -t wundergraph .
```

Run `docker run -p 9991:9991 wundergraph:latest` to test your image
