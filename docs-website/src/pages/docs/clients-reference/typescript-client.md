---
title: TypeScript Client
pageTitle: WunderGraph TypeScript Client
description: WunderGraph TypeScript Client reference
---

This is the base implementation of the WunderGraph HTTP protocol in TypeScript that can be used on both browser and server environments.
It's used as the base interface for the Web client, React and Next.js implementations.

## Configuration

Let's start by adding the WunderGraph TypeScript client generator to your project.

```typescript
// wundergraph.config.ts

configureWunderGraphApplication({
  // ... your configuration
  codeGenerators: [
    {
      templates: [templates.typescript.client],
      path: '../generated',
    },
  ],
});
```

## Create the client

The generated `createClient` will return a fully typesafe client that can be used to execute operations.

```ts
import { createClient } from 'generated/client';

const client = createClient();
```

## Client configuration

### Custom baseURL

The client can be configured with a custom baseURL.

```ts
const client = createClient({
  baseURL: 'https://my-custom-base-url.com',
});
```

### Node.js support

You can use the client on server environments that don't have a build-in fetch implementation by using the customFetch configuration option.

Install node-fetch or any other fetch polyfill.

```bash
npm i node-fetch
```

And add it to the client configuration.

```ts
import fetch from 'node-fetch';

const client = createClient({
  customFetch: fetch,
});
```

### Browser

If you target older browsers you will need a polyfill for fetch, AbortController, AbortSignal and possibly Promise.

```ts
import 'promise-polyfill/src/polyfill';
import 'yet-another-abortcontroller-polyfill';
import { fetch } from 'whatwg-fetch';

const client = createClient({
  customFetch: fetch,
});
```

### Adding custom headers

```ts
const client = createClient({
  extraHeaders: {
    customHeader: 'value',
  },
});

// or

client.setExtraHeaders({
  customHeader: 'value',
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

### One-of subscription

You can run subscriptions using `subscribeOnce`, this will return the subscription response directly and will not setup a stream.
This is useful for SSR purposes for example.

```ts
const response = await client.subscribe(
  {
    operationName: 'Countdown',
    input: {
      from: 100,
    },
    subscribeOnce: true,
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
client.login('github');
```

### Log out

```ts
client.logout({
  logoutOpenidConnectProvider: true,
});
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

## Error handling (ClientResponseError)

### Operations

The errors that can be returned from an operation are one of `ResponseError`, `InputValidationError`, or `GraphQLResponseError`. These three errors compose the type union named `ClientResponseError`.

Network errors and non 2xx responses are returned as a `ResponseError` or `InputValidationError` object and contain the status code through the `statusCode` property.
You can be sure that the request was successful if the method doesn't throw an error.

### GraphQLResponseError

Query and mutation errors are returned as a `GraphQLResponseError` object. By default, the first error specifies the error message, but you can access all GraphQL errors through the `errors` property:

```ts
const { data, error } = await client.query({
  operationName: 'Hello',
  input: {
    hello: 'World',
  },
});

if (error instanceof GraphQLResponseError) {
  error.errors[0].location;
} else if (error instanceof ResponseError) {
  error.statusCode;
}
```

### ResponseError

Methods that initiate a network request throw a `ResponseError` if the request fails to initiate or the response is not 2xx. Note that `ResponseError` returns a single error and does not have an `errors` property.

### InputValidationError

If the source of failure was due to an invalid input, the error received will be an `InputValdationError`. By default, the first error specifies the error message, but you can access all input validation errors through the `errors` property.

The `errors` property is an array of errors with the following structure:

```ts
type error = {
  propertyPath: string; // provides the path to the error (useful if the error nested)
  message: string; // the error
  invalidValue: any; // the invalid input
};
```

```ts
import { InputValidationError } from './InputValidationError';

const { data, error } = await client.query({
  operationName: 'Hello',
  input: {}, // a required input is missing
});

if (error instanceof InputValidationError) {
  error.message; // the top level error
  error.errors; // an array of errors
}
```

## Limitations

- Subscriptions are not supported server side, but can be fetched using `subscribeOnce`.
