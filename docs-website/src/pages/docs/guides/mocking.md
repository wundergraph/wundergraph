---
title: Mocking
pageTitle: WunderGraph - Testing
description: This guide shows how to mock your WunderGraph HTTP datasources or APIs
---

## Mocking

WunderGraph testing library comes with builtin support for mocking your HTTP datasources or APIs.
This allows you to test your application without having to rely on external services.

Our testing library is framework agnostic, so you can use it with your preferred test
framework. We use [Vitest](https://vitest.dev/) in this guide. It is a Jest Compatible test runner, but it should be easily adaptable to any testing framework.

### Initial setup

Make sure your `wundergraph.config.ts` is set up to generate the WunderGraph testing library. Take a closer look at the `url`. We use an environment variable to set the URL of the datasource. This allows us to replace the URL with the mock server URL when running the tests.

```typescript
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: new EnvironmentVariable('COUNTRIES_URL', 'https://countries.trevorblades.com/'),
});

configureWunderGraphApplication({
  apis: [countries],
  server,
  operations,
  codeGenerators: [
    {
      templates: [
        // Generate all TypeScript based templates, which includes the testing library
        ...templates.typescript.all,
      ],
    },
  ],
});
```

### Test setup

Within a test, you can import `createTestAndMockServer()` to create the test and mock server instances.
Note that depending on your project's settings, the path might be slightly different depending on where you generate your templates.
We use `beforeAll` to start the test and mock server instances. The `ts.start()` method returns a cleanup function to shutdown all servers. Alternatively, you can call `ts.stop()`.
In vitest you can return an async function to do a cleanup. We also use `mockURLEnvs` to replace the environment variables with the mock server URL.

{% callout type="note" %}
Before you run the tests and import the `createTestServer` function, you must run `wundergraph generate --env .env.local` to generate the testing library.
Some testing frameworks like Vitest or Jest provides a `globalSetup` hook that allows you to run a script before running the tests. In that way, you can automate it.
{% /callout %}

```ts
import { createTestAndMockServer, TestServers } from '../.wundergraph/generated/testing';

let ts: TestServers;

beforeAll(async () => {
  ts = createTestAndMockServer({
    // The directory where your wundergraph directory is located
    // This is only needed if you run the tests from a different directory than your wundergraph directory
    // __dirname is the directory of the current file.
    dir: join(__dirname, '..'),
  });

  return ts.start({
    // Environment variables replaced by the test mock server URL
    mockURLEnvs: ['COUNTRIES_URL'],
  });
});
```

#### Environment variables

WunderGraph has builtin support for loading environment variables from a `.env` file.
For testing, we recommend creating a `.env.test` file to set the environment variables for the test environment. This allows you to set the environment variables for the test environment without affecting your local development environment.
The test server search first for a `.env.test` file, and if it doesn't exist, it will fall back to `.env`. You can also pass environment variables to the test server with the `env` option of the `createTestAndMockServer` method.
None of these files should be committed to git. In your CI, you should use plain environment variables that come from your secret store.

### Writing tests

We recommended creating as few testing server instances as possible. These minimizes the number of times the server starts and stops, making your tests faster.

{% callout type="warning" %}
Due to the nature of the mock server, it is not possible right now to run multiple tests `it` concurrently.
If you have a demanding test suite, you can create multiple test files and vitest will run them in parallel by default.
{% /callout %}

#### Mocking HTTP datasources

When you setup a mock with `mock()` and the request matches, the mock server will return the response. If the request does not match, the mock server will return a 404 response and the call to `scope.done()` will fail the test.
You have also the ability to throw an error inside the response function to fail the mock. This is useful if you want to verify with test assertion that the request is correct. A thrown error is handled as an unmatched request and the next mock will be checked.

The first argument of the `mock` function is an object that accepts the following properties:

- `match` - A function that returns true if the request matches
- `handler` - A function that returns the response or throws an error
- `times` - The number of times the mock should be called. Defaults to 1.
- `persist` - If true, the mock will not be removed after any number of calls. Be careful with this option, as it can lead to unexpected results if you forget to remove the mock with `ts.mockServer.reset()` after the test. Defaults to false.

```ts
const scope = ts.mockServer.mock({
  match: ({ url, method }) => {
    return url.path === '/' && method === 'POST';
  },
  handler: async ({ json }) => {
    const body = await json();

    expect(body.variables.code).toEqual('ES');
    expect(body.query).toEqual(
      'query($code: String){countries_countries: countries(filter: {code: {eq: $code}}){code name capital}}'
    );

    return {
      status: 200,
      headers: {
        'X-Foo': 'Bar',
      },
      body: {
        data: {
          countries_countries: [
            {
              code: 'ES',
              name: 'Spain',
              capital: 'Madrid',
            },
          ],
        },
      },
    };
  },
});
```

### Make a request and validate the mock

The `createTestAndMockServer` returns a `WunderGraphTestServer` object that wraps the test server and the auto-generated type-safe client.

```ts
const result = await ts.testServer.client().query({
  operationName: 'CountryByCode',
  input: {
    code: 'ES',
  },
});

/**
 * Make sure to call scope.done() to verify that the request have been made
 * If the request was not made, the test will fail
 */
scope.done();

expect(result.error).toBeUndefined();
expect(result.data).toBeDefined();
expect(result.data?.countries_countries?.[0].capital).toBe('Madrid');
```

If an assertion fails or any error is thrown inside the handlers, the test will fail and the error will be rethrown when calling `scope.done()`. This ensure that the test runner can handle the error correctly e.g. by printing a stack trace or showing a diff.

```bash
AssertionError: expected 'ES' to deeply equal 'DE'
Caused by: No mock matched for request POST http://0.0.0.0:36331/
Expected :DE
Actual   :ES
<Click to see difference>

    at Object.handler (/c/app/countries.test.ts:29:33)
```

For a full example please check the example in the [WunderGraph repository](https://github.com/wundergraph/wundergraph/tree/main/packages/testsuite/apps/mock/test/mock-datasource.test.ts)

## Summary

This guide showed how easy it is to mock HTTP datasources. It gives you power to write integration tests fast and reliable.
You can apply the same principles to mock any HTTP API in your TypeScript functions.
