---
title: Configure WunderGraph Server options
pageTitle: WunderGraph - Configure WunderGraph Server options
description:
---

This section describes how to set configurations options of WunderGraph Server.

## List of available options:

During development all options are optional and will be set via EnvironmentVariables with default values

### `listen.host`

The host on which the WunderGraph Server should listen.

### `listen.port`

The port on which the WunderGraph Server should listen.

### `serverUrl`

This option allows you to configure the URL where your WunderGraph Server will be deployed.
This is important for the WunderNode to be able to comminucate with WunderGraph Server.

### `logger.level`

This option allows you to configure the logger level of WunderGraph Server.

## Options default values

Each option when unset will get a value from the `Default Environment Variables` or from the default value of that variable.

| Option         | Default Value           | Default Environment Variable |
| -------------- | ----------------------- | ---------------------------- |
| `listen.host`  | `127.0.0.1`             | `WG_SERVER_HOST`             |
| `listen.port`  | `9992`                  | `WG_SERVER_PORT`             |
| `serverUrl`    | `http://localhost:9992` | `WG_SERVER_URL`              |
| `logger.level` | `INFO`                  | `WG_LOG_LEVEL`               |

## Running in production

{% callout type="warning" %}
In production, it is mandatory to provide `serverUrl`, because WunderNode needs to know where the WunderGraphServer is deployed.
{% /callout %}

You could provide it either by setting the Default Environment Variable `WG_SERVER_URL` or as a static value.

{% callout type="warning" %}
When no options were provided you still could override default values by setting WG environment variables
{% /callout %}

{% callout type="warning" %}
When using custom environment variables, you need to make sure that the environment variables are set before:

- `wunderctl generate` command is executed
- `WunderGraph Server` starts

{% /callout %}

## Configuration examples

### Configure options with static values

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

### Configure options with custom environment variables

```typescript
import { EnvironmentVariable, LoggerLevel } from '@wundergraph/sdk'

export default configureWunderGraphServer<HooksConfig, InternalClient, WebhooksConfig>(() => ({
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

### Configure options with default environment variables

This configuration illustrates what options you will get when options are not provided via the config.

By using default environment variables names you could stick with Wundergraph Default behaviour but supply different default values.

```typescript
import { EnvironmentVariable, LoggerLevel, WgEnv } from '@wundergraph/sdk'

// use WgEnv enum to set variable names
export default configureWunderGraphServer<HooksConfig, InternalClient, WebhooksConfig>(() => ({
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
export default configureWunderGraphServer<HooksConfig, InternalClient, WebhooksConfig>(() => ({
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
