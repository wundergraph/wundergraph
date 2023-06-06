---
title: WunderGraph schema extension Example
pageTitle: WunderGraph - Examples - schema extension
description:
---

[Check the example](https://github.com/wundergraph/wundergraph/tree/main/examples/schema-extension)

## Configuration

Check Schema Extension configuration [doc](/docs/wundergraph-config-ts-reference/schema-extension-configuration).

## Getting started

```shell
docker-compose up

npm install && npm start
```

## Get Landpad

```shell
curl -N http://localhost:9991/operations/Space
```

## Get Users

```shell
curl -N http://localhost:9991/operations/Users
```

## Create User

```shell
curl -d '{"email":"test@wundergraph.com","name":"Test","payload": {"type":"mobile","phone":"12345"}}' -H "Content-Type: application/json" -X POST http://localhost:9991/operations/User
```
