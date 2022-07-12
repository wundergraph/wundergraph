# Wundergraph TypeScript Client

![wundergraph-client](https://img.shields.io/npm/v/@wundergraph/client.svg)

WunderGraph TypeScript client library.

## Getting Started

```shell
npm install @wundergraph/client
```

### Create the client

```ts
import { WunderGraphClient } from '@wundergraph/client';

const client = new WunderGraphClient({
  applicationHash: '1f7dac83',
  applicationPath: 'api/main',
  baseURL: 'http://localhost:9991',
  sdkVersion: '0.95.0',
  authenticationEnabled: true,
});
```

### Run a query

```ts
const result = await client.query(
  {
    operationName: 'Hello',
    requiresAuthentication: false,
  },
  {
    input: {
      hello: 'World',
    },
  }
);
```

### Mutation

```ts
const result = await client.mutate(
  {
    operationName: 'SetName',
    requiresAuthentication: false,
  },
  {
    input: {
      name: 'WunderGraph',
    },
  }
);
```

### LiveQuery

```ts
const result = await client.subscribe(
  {
    operationName: 'Hello',
    isLiveQuery: true,
    requiresAuthentication: false,
  },
  {
    input: {
      name: 'World',
    },
  }
);
```

### Upload files

```ts
const result = await client.uploadFiles({
  provider: S3Provider.minio,
  files,
});
```

## Auth

### Login

```ts
client.login(AuthProviders.github);
```

### Log out

```ts
client.logout();
```

### Fetch user

```ts
const user = await client.fetchUser();
```
