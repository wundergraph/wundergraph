# Migration steps

| Version range | Migration complexity | Info                                              |
| ------------- | -------------------- | ------------------------------------------------- |
| 0.122-0.123.x | low                  | Provide new SDK entry point for server components |

## Update `wundergraph.server.ts` to match the imports

From

```ts
import {
  configureWunderGraphServer,
  GithubWebhookVerifier,
  EnvironmentVariable,
  WgEnv,
  LoggerLevel,
} from '@wundergraph/sdk';
```

to

```ts
import {
  configureWunderGraphServer,
  GithubWebhookVerifier,
  EnvironmentVariable,
  WgEnv,
  LoggerLevel,
} from '@wundergraph/sdk/server'; // <--- /server added
```
