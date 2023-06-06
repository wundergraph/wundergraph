---
title: Configure WunderGraph Server options
description: Reference documentation for the WunderGraph Server options.
---

This section describes how to set configurations options of WunderGraph Server.

## List of available options:

During development all options are optional and will be set via `new EnvironmentVariable` with default values

### `listen.host` (optional)

The host on which the WunderGraph Server should listen.

### `listen.port` (optional)

The port on which the WunderGraph Server should listen.

### `serverUrl` (optional)

This option allows you to configure the URL where your WunderGraph Server will be deployed.
This is important for the WunderNode to be able to communicate with WunderGraph Server.
If no value is provided, `listen.host` and `listen.port` will be used to generate the URL.

### `logger.level` (optional)

This option allows you to configure the logger level of WunderGraph Server.

### `openTelemetry.enabled` (optional)

This option indicates whether OpenTelemetry tracing should be enabled.

### `openTelemetry.sampler` (optional)

This option allows you to configure the OpenTelemetry sampler. The default sampler is 1.0, which means that all requests will be sampled.
You need to provide a number between 0.0 and 1.0 to configure the sampler.

### `openTelemetry.exporterHttpEndpoint` (optional)

This option allows you to configure the OpenTelemetry HTTP exporter endpoint. The default endpoint is `http://localhost:4318`. The current supported OTLP endpoint is set fixed to `/v1/tracer`.

### `openTelemetry.authToken` (optional)

This option allows you to configure the OpenTelemetry HTTP exporter with an authentication token. Currently, we only support JWT authentication in combination with our [JWT authenticator](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/20524) plugin.

## Options default values

Each option when unset will get a value from the `Default Environment Variables` or from the default value of that variable.

| Option                               | Default Value           | Default Environment Variable     |
| ------------------------------------ | ----------------------- | -------------------------------- |
| `listen.host`                        | `localhost`             | `WG_SERVER_HOST`                 |
| `listen.port`                        | `9992`                  | `WG_SERVER_PORT`                 |
| `serverUrl`                          | `http://localhost:9992` | `WG_SERVER_URL`                  |
| `logger.level`                       | `info`                  | `WG_LOG_LEVEL`                   |
| `openTelemetry.enabled`              | `false`                 | `WG_OTEL_ENABLED`                |
| `openTelemetry.sampler`              | `1.0`                   | `WG_OTEL_SAMPLER`                |
| `openTelemetry.exporterHttpEndpoint` | `http://localhost:4318` | `WG_OTEL_EXPORTER_HTTP_ENDPOINT` |
| `openTelemetry.authToken`            | ``                      | `WG_OTEL_AUTH_TOKEN`             |

## Running in production

{% callout type="warning" %}
If you run the server and node in standalone mode, it is mandatory to provide `serverUrl`, because WunderNode needs to know where the WunderGraph server is deployed.
{% /callout %}

You could provide it either by setting the Default Environment Variable `WG_SERVER_URL` or as a static value.

{% callout type="warning" %}
When no options were provided you still could override default values by setting WG environment variables
{% /callout %}

{% callout type="warning" %}
When using custom environment variables, you need to make sure that the environment variables are set before:

- `wunderctl generate` command is executed
- `wunderctl start` or `wunderctl server start` command is executed

{% /callout %}

## Configuration examples

### Configure options with static values

```typescript
export default configureWunderGraphServer(() => ({
  options: {
    listen: {
      host: 'localhost',
      port: '5555',
    },
    serverUrl: 'http://localhost:5555/',
    logger: {
      level: 'debug',
    }
  },
})
```

### Configure options with custom environment variables

```typescript
import { configureWunderGraphServer, EnvironmentVariable, LoggerLevel } from '@wundergraph/sdk/server'

export default configureWunderGraphServer(() => ({
  options: {
    listen: {
      host: new EnvironmentVariable('SERVER_HOST', 'localhost'),
      port: new EnvironmentVariable('SERVER_PORT', '4444'),
    },
    serverUrl: new EnvironmentVariable('SERVER_URL', 'http://localhost:4444/'),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>('NODE_LOG_LEVEL', 'debug'),
    },
  },
})
```

### Configure options with default environment variables

This configuration illustrates what options you will get when options are not provided via the config.

By using default environment variables names you could stick with Wundergraph Default behaviour but supply different default values.

```typescript
import { configureWunderGraphServer, EnvironmentVariable, LoggerLevel, WgEnv } from '@wundergraph/sdk/server'

// use WgEnv enum to set variable names
export default configureWunderGraphServer(() => ({
  options: {
    listen: {
      host: new EnvironmentVariable(WgEnv.ServerHost, 'localhost'),
      port: new EnvironmentVariable(WgEnv.ServerPort, '9992'),
    },
    serverUrl: new EnvironmentVariable(
      WgEnv.ServerUrl,
      'http://localhost:9992/'
    ),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>(WgEnv.LogLevel, 'info'),
    },
  },
})

// alternative using plain string variable names
export default configureWunderGraphServer(() => ({
  options: {
    listen: {
      host: new EnvironmentVariable('WG_SERVER_HOST', 'localhost'),
      port: new EnvironmentVariable('WG_SERVER_PORT', '9992'),
    },
    serverUrl: new EnvironmentVariable(
      'WG_SERVER_URL',
      'http://localhost:9992/'
    ),
    logger: {
      level: new EnvironmentVariable<LoggerLevel>('WG_LOG_LEVEL', 'info'),
    },
  },
})
```
