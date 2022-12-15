# RFC - Typesafe environment variables

This RFC proposes a standard for defining and using type-safe environment variables in WunderGraph. The goal of this proposal is to provide a consistent and type-safe way to access and use environment variables, while also allowing for easy validation and error-handling.

## Motivation

The use of environment variables can be error-prone due to their lack of type safety. It's easy to overlook missing environment variables and there is no built-in autocompletion when accessing `process.env` or `EnvironmentVariable`.

Problems that this RFC tries to solve are;

- Easy to forget configuring environment variables.
- There is no validation to make sure variables contain the correct value.
- Hard to debug which variables are missing.
- No autocomplete support.

## Solution

A new `wundergraph.env.ts` configuration where all available environment variables can be configured. The configuration supports a schema, so the values can be validated.

### Configuration

```ts
import { z } from 'zod';
import { configureEnv } from '@wundergraph/sdk';

const schema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	OAUTH_CLIENT_ID: z.string().describe('OAuth Client ID'),
	SQLITE_DB: z.string().optional(),
});

export default configureEnv(schema);
```

configureEnvironment accepts any schema definition that supports a `safeParse` method. It parses `process.env` and adds the configured variables to the return object. If a required env var is missing the validator will throw an error and the WunderNode will fail to run on production, and will be in error state in dev mode, untill the variable has been configured.

There is no difference between build/runtime variables. We make sure process.env is setup with WG defaults (like cookie secrets) before running validation. 

### Usage

Instead of using `process.env.VAR` we now have typesafe access to our environment variables like so;

```ts
import env from '.wundergraph/wundergraph.env';

env.WG_NODE_URL; // http://localhost:9991
env.OAUTH_CLIENT_ID;

new EnvironmentVariable('WG_SERVER_PORT', '9992');
```

### EvironmentVariable

When the config is generated we also generate a type declaration for `EnvironmentVariable`.

```
declare global {
    interface WundergraphEnv {
      NODE_ENV: 'development' | 'production';
      OAUTH_CLIENT_ID: string;
      [key: string]: string // we need this because there might be untyped variables available like the WG_ variables.
    }
}
```

```ts
new EnvironmentVariable('OAUTH_CLIENT_ID')
```

### configureEnv

```ts
const configureEnv = (schema: AnySchema) => {
	const _env = schema.safeParse(process.env);

	if (!_env.success) {
		console.error(
			'❌ Invalid environment variables:\n',
			...formatErrors(_env.error.format()) // do some nice formatting for the console output
		);
		throw new Error('Invalid environment variables');
	}

	return {
		...env.data,
		...wgEnv,
	};
};
```
