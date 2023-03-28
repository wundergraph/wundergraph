# Wundergraph TypeScript Client

This directory contains the base implementation of the WunderGraph HTTP protocol in TypeScript that can be used on both browser and server environments.
It's used as the base interface for the Web client, React and Next.js implementations.

Use it to build your own 3rd party integration with WunderGraph.

## Getting Started

```shell
npm install @wundergraph/sdk
```

### Create the client

```ts
import { Client } from '@wundergraph/sdk/client';

const client = new Client({
  applicationHash: '1f7dac83',
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
import { Client } from '@wundergraph/sdk/client';
import fetch from 'node-fetch';

const client = new Client({
  applicationHash: '1f7dac83',
  baseURL: 'http://localhost:9991',
  sdkVersion: '0.95.0',
  customFetch: fetch,
});
```

### Type-safe Client

If you use the client in combination with your WunderGraph you can use the auto-generated `createClient` function to create a fully type-safe client. This is the recommended way to use the client.

```ts
import { createClient } from '../.wundergraph/generated/client';
const client = createClient();
```

### Browser

If you target older browsers you will need a polyfill for fetch, AbortController, AbortSignal and possibly Promise.

```ts
import 'promise-polyfill/src/polyfill';
import 'yet-another-abortcontroller-polyfill';
import { fetch } from 'whatwg-fetch';

const client = new Client({
  applicationHash: '1f7dac83',
  baseURL: 'http://localhost:9991',
  sdkVersion: '0.95.0',
  customFetch: fetch,
});
```

## Adding custom headers

```ts
const client = new Client({
  applicationHash: '1f7dac83',
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
const response = await client.query({
  operationName: 'Hello',
  input: {
    hello: 'World',
  },
});
```

### Mutation

```ts
const response = await client.mutate({
  operationName: 'SetName',
  input: {
    name: 'WunderGraph',
  },
});
```

### LiveQuery

```ts
client.subscribe(
  {
    operationName: 'Hello',
    input: {
      name: 'World',
    },
    liveQuery: true,
  },
  (response) => {}
);
```

### Subscription

```ts
client.subscribe(
  {
    operationName: 'Countdown',
    input: {
      from: 100,
    },
  },
  (response) => {}
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

## AbortController

Almost all methods accept an AbortController instance that can be used to cancel the request.

```ts
const controller = new AbortController();

const { fileKeys } = await client.uploadFiles({
  abortSignal: abortController.signal,
  provider: S3Provider.minio,
  files,
});

// cancel the request
controller.abort();
```

## Type-safe error handling

### Operations

Query, Subscription and mutation errors are returned as a `ResponseError` object. By default, the first error specify the error message but you can access all errors through the `errors` property.
Every error contain the HTTP response status code as `statusCode` property.

#### Base Errors

For common errors like 401, 400, 500, we provide built in Error classes that can be used to identify the error more conveniently. Those errors are available to GraphQL and TypeScript operations.

```ts
import { AuthorizationError, InputValidationError, InternalError } from '@wundergraph/sdk/client';

if (error instanceof AuthorizationError) {
  // 401
}
if (error instanceof InputValidationError) {
  // 400
}
if (error instanceof InternalError) {
  // 500
}
```

#### GraphQL Operations

GraphQL operation errors are not meant to be used to communicate application errors to the client. We recommend to design them as part of your GraphQL schema.

```ts
const { data, error } = await client.query({
  operationName: 'GetWeather',
  input: {
    forCity: 'Berlin',
  },
});

if (createProjectStatus?.__typename === 'cityNotFound') {
  // handle error the GraphQL way
}
```

#### TypeScript Operations

All known and custom errors have a `code` property that can be used to identify the error. This is useful if you want to work with custom errors in a type-safe way.
If you want to create customer errors for TypeScript operations, you can extend the `OperationError` base class and throw it in your handler.

```ts
import { ReponseError } from '@wundergraph/sdk/client';
import { createClient } from '../.wundergraph/generated/client';

const client = createClient();
const { data, error } = await client.query({
  operationName: 'users/get',
});

if (error instanceof ReponseError) {
  // handle error
  error.code;
}

// or type-safe

if (error?.code === 'AuthorizationError') {
  // handle error
} else if (error?.code === 'DividedByZero') {
  // handle error
}
```

> Note: The TypeScript client is compatible with Node.js and the browser. We provide optimized packages for Next.js, React, Vite and Remix.

### Other

Methods that initiate a network request throw a `ResponseError` or `Error` if the request fails to initiate or the response is not 2xx.
You can be sure that the request was successful if the method doesn't throw an error.

## Limitations

- Subscriptions are not supported server side
