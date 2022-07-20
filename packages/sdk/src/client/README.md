# Wundergraph TypeScript Client

![wundergraph-client](https://img.shields.io/npm/v/@wundergraph/sdk.svg)

This is the base implementation of the WunderGraph HTTP protocol in TypeScript.
It's used as the base interface for the Web client, React and Next.js implementations.

Use it to build your own 3rd party integration with WunderGraph.

## Getting Started

```shell
npm install @wundergraph/sdk
```

### Create the client

```ts
import { WunderGraphClient } from '@wundergraph/sdk/client';

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
client.subscribe(
  {
    operationName: 'Hello',
  },
  (result) => {},
  {
    isLiveQuery: true,
    input: {
      name: 'World',
    },
  }
);
```

### Subscription

```ts
client.subscribe(
  {
    operationName: 'Countdown',
  },
  (result) => {},
  {
    input: {
      from: 100,
    },
  }
);
```

### Upload files

```ts
const { fileKeys } = await client.uploadFiles({
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
