---
title: Configure WunderNode options
pageTitle: 'WunderGraph - Configure WunderNode options'
description:
---

This section describes how to set configurations options of WunderNode.

## Available options:

### `listen.host` (optional)

The host on which the WunderNode should listen.

### `listen.port` (optional)

The port on which the WunderNode should listen.

### `nodeUrl` (optional)

This option allows you to configure the URL where your WunderNode will be deployed.
This is important for the WunderGraph Server to be able to comminucate with WunderNode.

Also, this url is used to set a base URL for the `.graphqlconfig` file and postman collection

### `logger` (optional)

This option allows you to configure the logger level of WunderNode.

## Example configuration

```typescript
configureWunderGraphApplication({
  options: {
    listen: {
      host: '127.0.0.1',
      port: '4444',
    },
    nodeUrl: 'http://localhost:4444/',
    logger: {
      level: 'DEBUG',
    },
  },
})
```

## Example configuration with custom environment variables

```typescript
import { EnvironmentVariable, LoggerLevel } from '@wundergraph/sdk'

configureWunderGraphApplication({
  options: {
    listen: {
      host: new EnvironmentVariable('NODE_HOST', '127.0.0.1'),
      port: new EnvironmentVariable('NODE_PORT', '4444'),
    },
    nodeUrl: new EnvironmentVariable('NODE_URL', 'http://localhost:4444/'),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>('NODE_LOG_LEVEL', 'DEBUG'),
    },
  },
})
```

## Example configuration with default environment variables

This configuration fully represents default options if you don't provide any options.

```typescript
import { EnvironmentVariable, LoggerLevel, WgEnv } from '@wundergraph/sdk'

// use WgEnv enum to set variable names
configureWunderGraphApplication({
  options: {
    listen: {
      host: new EnvironmentVariable(WgEnv.NodeHost, '127.0.0.1'),
      port: new EnvironmentVariable(WgEnv.NodePort, '9991'),
    },
    nodeUrl: new EnvironmentVariable(WgEnv.NodeUrl, 'http://localhost:9991/'),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'INFO'),
    },
  },
})

// alternative using plain string variable names
configureWunderGraphApplication({
  options: {
    listen: {
      host: new EnvironmentVariable('WG_NODE_HOST', '127.0.0.1'),
      port: new EnvironmentVariable('WG_NODE_PORT', '9991'),
    },
    nodeUrl: new EnvironmentVariable('WG_NODE_URL', 'http://localhost:9991/'),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>('WG_LOG_LEVEL', 'INFO'),
    },
  },
})
```

{% callout type="warning" %}
When no options were provided you still could override default values by setting WG environment variables
{% /callout %}

{% callout type="warning" %}
When using custom environment variables, you need to make sure that the environment variables are set before:

- `wunderctl generate` command is executed
- `WunderNode` starts

{% /callout %}
