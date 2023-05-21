---
title: Configure WunderNode options
pageTitle: 'WunderGraph - Configure WunderNode options'
description: How to set configurations options of WunderNode.
---

This section describes how to set configurations options of WunderNode.

## List of available options:

During development all options are optional and will be set via EnvironmentVariables with default values

### `listen.host` (optional)

The host on which the WunderNode should listen.

### `listen.port` (optional)

The port on which the WunderNode should listen.

### `nodeUrl` (optional)

This option allows you to configure the internal URL where your WunderNode will be deployed in the internal network.
This is important for the WunderGraph Server to be able to comminucate with WunderNode.

The `nodeUrl` is used in internal client requests to WunderNode in the hooks and webhooks.

### `publicNodeUrl` (optional)

This option allows you to configure the Public URL on which you WunderNode Api will be accessible.
It is used for example in the generated clients, in the GraphQL playground, OpenAPI specification and Postman collection.

### `logger.level` (optional)

This option allows you to configure the logger level of WunderNode.

## Options default values

Each option when unset will get a value from the `Default Environment Variables` or from the default value of that variable.

| Option                | Default Value           | Default Environment Variable |
| --------------------- | ----------------------- | ---------------------------- |
| `listen.host`         | `localhost`             | `WG_NODE_HOST`               |
| `listen.port`         | `9991`                  | `WG_NODE_PORT`               |
| `listenInternal.port` | `9993`                  | `WG_NODE_INTERNAL_PORT`      |
| `nodeUrl`             | `http://localhost:9991` | `WG_NODE_URL`                |
| `publicNodeUrl`       | `http://localhost:9991` | `WG_PUBLIC_NODE_URL`         |
| `logger.level`        | `info`                  | `WG_LOG_LEVEL`               |

In case in options only `listen.port` is provided, the `nodeUrl` and `publicNodeUrl` will be set to `http://localhost:<port>`

## Running in production

{% callout type="warning" %}
In production it is mandatory to provide:

- `publicNodeUrl` - to have a proper configuration of generated clients, graphiql, graphqlconfig and postman collection
- `nodeUrl` - when you want to run WunderNode in a different network/host than WunderGraph Server

{% /callout %}

You could provide it either by setting the Default Environment Variable or as a static value:

- `WG_NODE_URL`
- `WG_PUBLIC_NODE_URL`

{% callout type="warning" %}
When no options were provided you still could override default values by setting WG environment variables
{% /callout %}

{% callout type="warning" %}
When using custom environment variables, you need to make sure that the environment variables are set before:

- `wunderctl generate` command is executed
- `wunderctl start`, `wunderctl node start` or `wunderctl server start` command is executed

{% /callout %}

## Configuration examples

### Configure options with static values

```typescript
configureWunderGraphApplication({
  options: {
    listen: {
      host: 'localhost',
      port: '4444',
    },
    listenInternal: {
      port: '4445',
    },
    nodeUrl: 'http://my-internal-network-node:4444/',
    publicNodeUrl: 'http://my-api.example.com/',
    logger: {
      level: 'DEBUG',
    },
  },
});
```

### Configure options with custom environment variables

```typescript
import { EnvironmentVariable, LoggerLevel } from '@wundergraph/sdk';

configureWunderGraphApplication({
  options: {
    listen: {
      host: new EnvironmentVariable('NODE_HOST', 'localhost'),
      port: new EnvironmentVariable('NODE_PORT', '4444'),
    },
    listenInternal: {
      port: new EnvironmentVariable('NODE_INTERNAL_PORT', '4445'),
    },
    nodeUrl: new EnvironmentVariable('NODE_URL', 'http://localhost:4444/'),
    publicNodeUrl: new EnvironmentVariable('PUBLIC_NODE_URL', 'http://my-api.example.com/'),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>('NODE_LOG_LEVEL', 'info'),
    },
  },
});
```

### Configure options with default environment variables

This configuration illustrates what options you will get when options are not provided via the config.

By using default environment variables names you could stick with Wundergraph Default behaviour but supply different default values.

```typescript
import { EnvironmentVariable, LoggerLevel, WgEnv } from '@wundergraph/sdk';

// use WgEnv enum to set variable names
configureWunderGraphApplication({
  options: {
    listen: {
      host: new EnvironmentVariable(WgEnv.NodeHost, 'localhost'),
      port: new EnvironmentVariable(WgEnv.NodePort, '9991'),
    },
    listenInternal: {
      port: new EnvironmentVariable(WgEnv.NodeInternalPort, '9993'),
    },
    nodeUrl: new EnvironmentVariable(WgEnv.NodeUrl, 'http://localhost:9991/'),
    publicNodeUrl: new EnvironmentVariable(WgEnv.PublicNodeUrl, 'http://my-api.example.com/'),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'info'),
    },
  },
});

// alternative using plain string variable names
configureWunderGraphApplication({
  options: {
    listen: {
      host: new EnvironmentVariable('WG_NODE_HOST', 'localhost'),
      port: new EnvironmentVariable('WG_NODE_PORT', '9991'),
    },
    listenInternal: {
      port: new EnvironmentVariable('WG_NODE_INTERNAL_PORT', '9993'),
    },
    nodeUrl: new EnvironmentVariable('WG_NODE_URL', 'http://localhost:9991/'),
    publicNodeUrl: new EnvironmentVariable('WG_PUBLIC_NODE_URL', 'http://my-api.example.com/'),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>('WG_LOG_LEVEL', 'info'),
    },
  },
});
```
