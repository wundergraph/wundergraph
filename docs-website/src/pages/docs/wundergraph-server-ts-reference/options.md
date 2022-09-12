---
title: Configure WunderGraph Server options
pageTitle: WunderGraph - Configure WunderGraph Server options
description:
---

This section describes how to set configurations options of WunderGraph Server.

## Available options:

### `listen.host` (optional)

The host on which the WunderGraph Server should listen.

### `listen.port` (optional)

The port on which the WunderGraph Server should listen.

### `serverUrl` (optional)

This option allows you to configure the URL where your WunderGraph Server will be deployed.
This is important for the WunderNode to be able to comminucate with WunderGraph Server.

### `logger` (optional)

This option allows you to configure the logger level of WunderGraph Server.

## Example configuration

```typescript
export default configureWunderGraphServer<HooksConfig, InternalClient, WebhooksConfig>(() => ({
  options: {
    listen: {
      host: '127.0.0.1',
      port: '5555',
    },
    serverUrl: 'http://localhost:5555/',
    logger: {
      level: 'DEBUG',
    }
  },
})
```

## Example configuration with custom environment variables

```typescript
import { EnvironmentVariable, LoggerLevel } from '@wundergraph/sdk'

configureWunderGraphApplication({
  options: {
    listen: {
      host: new EnvironmentVariable('SERVER_HOST', '127.0.0.1'),
      port: new EnvironmentVariable('SERVER_PORT', '4444'),
    },
    serverUrl: new EnvironmentVariable('SERVER_URL', 'http://localhost:4444/'),
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
      host: new EnvironmentVariable(WgEnv.ServerHost, '127.0.0.1'),
      port: new EnvironmentVariable(WgEnv.ServerPort, '9992'),
    },
    serverUrl: new EnvironmentVariable(
      WgEnv.ServerUrl,
      'http://localhost:9992/'
    ),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'INFO'),
    },
  },
})

// alternative using plain string variable names
configureWunderGraphApplication({
  options: {
    listen: {
      host: new EnvironmentVariable('WG_SERVER_HOST', '127.0.0.1'),
      port: new EnvironmentVariable('WG_SERVER_PORT', '9992'),
    },
    serverUrl: new EnvironmentVariable(
      'WG_SERVER_URL',
      'http://localhost:9992/'
    ),
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
- `WunderGraph Server` starts

{% /callout %}
