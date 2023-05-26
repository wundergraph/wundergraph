---
title: WunderGraph Conventions
description: Everything you need to know about WunderGraph Conventions.
---

- A valid WunderGraph application must have `.wundergraph` directory
- The `.wundergraph` directory must contain the following files:
  - `wundergraph.config.ts`
  - `wundergraph.server.ts`
  - `wundergraph.operations.ts`

## Everything you need to know about using Environment Variables

WunderGraph is a bit special in terms of how you can use environment variables.
This section explains why that is and how you can use them.

### wundergraph.config.ts

Early on, we've made the decision that you should not configure your API Gateway using YAML, JSON or similar ways.
Instead, you should use TypeScript to "generate" the configuration.

Using TypeScript to generate the configuration has many advantages,
like it's possible to re-use the same configuration for multiple APIs,
and you're able to leverage the rich type system of TypeScript to make sure that your configuration is valid.

When writing your configuration in `wundergraph.config.ts`,
you might be tempted to use `process.env.{VARIABLE_NAME}` to get the value of an environment variable.
Apparently, this will not work.

When you run `wunderctl up`,
we will compile `wundergraph.config.ts` and execute it to generate the final configuration (`wundergraph.config.json`).

The API Gateway will then load the configuration from `wundergraph.config.json`.
If you were using `process.env.{VARIABLE_NAME}`, how would the API Gateway know what value to use?

That's why we've added the `EnvironmentVariable` class to the WunderGraph SDK.
Here's an example:

```typescript
// wundergraph.config.ts

import { EnvironmentVariable } from '@wundergraph/sdk';

configureWunderGraphApplication({
  authentication: {
    cookieBased: {
      providers: [
        authProviders.openIdConnect({
          id: 'keycloak',
          clientId: new EnvironmentVariable('KEYCLOAK_CLIENT_ID'),
          clientSecret: new EnvironmentVariable('KEYCLOAK_CLIENT_SECRET'),
          issuer: new EnvironmentVariable('KEYCLOAK_ISSUER'),
        }),
      ],
      authorizedRedirectUris: ['http://localhost:3000'],
    },
  },
});
```

Once we generate the configuration,
the `EnvironmentVariable` name will be encoded in the configuration.
When the API Gateway loads the configuration,
it will use the `EnvironmentVariable` name to get the value of the environment variable.

This way, you can define variables in your TypeScript configuration,
and the API Gateway can load the values at runtime,
giving you the flexibility to change the values through the environment.

Most importantly,
this approach allows you to keep secrets and API keys out of the generated configuration.
You can safely commit the generated configuration to your repository,
if you're using Environment Variables this way.

If you were using `process.env.{VARIABLE_NAME}`,
the environment variable would resolve during the build process of the configuration,
so the value would be statically encoded in the configuration.

### wundergraph.server.ts

The section above talked about how we're using TypeScript to generate the configuration and why we've introduced the `EnvironmentVariable` class.
In contrast to generating the configuration,
the `wundergraph.server.ts` file is actually compiled and executed at runtime.

So, you're safe to use `process.env.{VARIABLE_NAME}` in your `wundergraph.server.ts` file.

### Wundergraph Default Environment Variables

By default, when no options are passed to `wundergraph.config.ts` or `wundergraph.server.ts`, we will use environment variables with default values:

| Variable name           | Description                                                        | Default value           |
| ----------------------- | ------------------------------------------------------------------ | ----------------------- |
| `WG_LOG_LEVEL`          | The log level of the `WunderNode`/`WunderGraph Server`.            | `info`                  |
| `WG_NODE_URL`           | The internal URL of the `WunderNode`.                              | `http://localhost:9991` |
| `WG_NODE_INTERNAL_URL`  | The internal URL of the `WunderNode` handling internal operations. | `http://localhost:9993` |
| `WG_PUBLIC_NODE_URL`    | The publicly available URL of the `WunderNode`.                    | `http://localhost:9991` |
| `WG_NODE_HOST`          | The host of the `WunderNode`.                                      | `localhost`             |
| `WG_NODE_PORT`          | The port of the `WunderNode`.                                      | `9991`                  |
| `WG_NODE_INTERNAL_PORT` | The port of the `WunderNode` for internal operations.              | `9993`                  |
| `WG_SERVER_URL`         | The URL of the `WunderGraph Server`.                               | `http://localhost:9992` |
| `WG_SERVER_HOST`        | The host of the `WunderGraph Server`.                              | `localhost`             |
| `WG_SERVER_PORT`        | The port of the `WunderGraph Server`.                              | `9992`                  |
| `WG_PROMETHEUS_ENABLED` | Whether to enable Prometheus metrics.                              | `true`                  |
| `WG_PROMETHEUS_PORT`    | Port used to serve Prometheus metrics.                             | `8881`                  |

### Available log levels

- `fatal`
- `panic`
- `warning`
- `error`
- `info`
- `debug`

To have a proper code completions for log level you could use exported type from our sdk

```typescript
import { LoggerLevel } from '@wundergraph/sdk';

const level: LoggerLevel = 'warning';
```

#### How to use default environment variables

When you want to use default environment variables you don't have to type them manually as we are providing enum for that.

```typescript
import { WgEnv } from '@wundergraph/sdk';
import { EnvironmentVariable } from './variables';

const varName = WgEnv.ServerPort; // WG_SERVER_PORT
const variable = new EnvironmentVariable(WgEnv.ServerPort, '9992');
```

### Summary

- wundergraph.config.ts: Runs at build time, use `EnvironmentVariable` to inject environment variables into your configuration
- variables defined using `EnvironmentVariable` will be resolved by the API Gateway at runtime
- wundergraph.server.ts: Runs at runtime, use `process.env.{VARIABLE_NAME}` to access environment variables
