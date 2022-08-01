# Wundergraph TypeScript Client

![wundergraph-client](https://img.shields.io/npm/v/@wundergraph/sdk.svg)

This is the base implementation of the WunderGraph HTTP protocol in TypeScript that can be used on both browser and server environments.
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
});
```

## Custom Fetch

### Node.js support

You can use the client on server environments that don't have a build-in fetch implementation by using the customFetch configuration option.

Install node-fetch or any other fetch polyfill.

```bash
npm i node-fetch
```

```ts
import { WunderGraphClient } from '@wundergraph/sdk/client';
import fetch from 'node-fetch';

const client = new WunderGraphClient({
  applicationHash: '1f7dac83',
  applicationPath: 'api/main',
  baseURL: 'http://localhost:9991',
  sdkVersion: '0.95.0',
  customFetch: fetch,
});
```

### Browser

If you target older browsers you will need a polyfill for fetch, AbortController, AbortSignal and possibly Promise.

```ts
import 'promise-polyfill/src/polyfill';
import 'yet-another-abortcontroller-polyfill';
import { fetch } from 'whatwg-fetch';

const client = new WunderGraphClient({
  applicationHash: '1f7dac83',
  applicationPath: 'api/main',
  baseURL: 'http://localhost:9991',
  sdkVersion: '0.95.0',
  customFetch: fetch,
});
```

## Adding custom headers

```ts
const client = new WunderGraphClient({
  applicationHash: '1f7dac83',
  applicationPath: 'api/main',
  baseURL: 'http://localhost:9991',
  sdkVersion: '0.95.0',
  extraHeaders: {
    customHeader: 'value',
  },
});
```

## Methods

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
