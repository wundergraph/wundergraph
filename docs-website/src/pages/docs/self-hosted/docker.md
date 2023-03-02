---
title: 'Deploy with Docker'
pageTitle: WunderGraph - Deploy with Docker
description: How to deploy WunderGraph with Docker
---

WunderGraph can be deployed using Docker. This guide will walk you through the process of creating your Dockerfile, that can be deployed to any Docker hosting provider.

## Dockerfile

This is an example Dockerfile that can be used as a starting point for your project.

```docker
# Image layer for building the application
FROM node:18-alpine as build

# global npm dependencies: recommended to place those dependencies in the non-root user directory
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
# optionally if you want to run npm global bin without specifying path
ENV PATH=$PATH:/home/node/.npm-global/bin

WORKDIR /usr/src/app

# rebuild image when package.json or lock has changed
COPY package*.json ./

# install dependencies
RUN npm ci --only=production

# add project artifacts to docker image
ADD . .

# generate your wundergraph application
RUN npm exec wunderctl generate

# Image layer for production
FROM node:18-alpine as runner
WORKDIR /usr/src/app

# copy entire project and dependencies
COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/.wundergraph ./.wundergraph
# copy wunderctl
COPY --from=build --chown=node:node /usr/src/app/node_modules/@wundergraph/wunderctl/download/wunderctl /usr/local/bin/wunderctl

RUN wunderctl version

# run as non-root user
USER node

WORKDIR .wundergraph

CMD WG_NODE_HOST=0.0.0.0 wunderctl start

EXPOSE 9991
```

## Test

```bash
# Install your project to generate a lockfile
npm i
# Build the docker image
docker build -t wundergraph .
```

Run `docker run -p 9991:9991 wundergraph:latest` to test your image

Check out our (Docker example repository)[https://github.com/wundergraph/docker] for more information.
