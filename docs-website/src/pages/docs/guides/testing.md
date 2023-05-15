---
title: Testing
pageTitle: WunderGraph - Testing
description: This guide shows how to test your WunderGraph applications
---

## Integration testing

WunderGraph comes with builtin support for running tests against your APIs, using a our
TypeScript client. Leverage our testing server implementation to set up your WunderGraph
server, run your test, and finally tear everything down.

Our testing library is framework agnostic, so you can use it with your preferred test
framework. We use both [Jest](https://jestjs.io) and [ava](https://github.com/avajs/ava) for
these examples, but they should be easily adaptable to any testing framework.

### Initial setup

Make sure your `wundergraph.config.ts` is set up to generate the WunderGraph testing library:

```typescript

configureWunderGraphApplication({
	apis: [
        ...
	],
	server,
	operations,
  generate:{
    codeGenerators: [],
  },
});
```

{% callout type="note" %}
Before you run the tests and import the `createTestServer` function, you must run `wundergraph generate --env .env.local` to generate the testing library.
Some testing frameworks like Vitest or Jest provides a `globalSetup` hook that allows you to run a script before running the tests. In that way, you can automate it.
{% /callout %}

Within a test, you can use `WunderGraphTestServer.client()` to retrieve a TypeScript WunderGraph client
instance ready to query the server set up by the testing library.

### Testing with Jest

Create your test file and import `createTestServer` from `./.wundergraph/generated/testing`. Note
that depending on your project's settings, the path might be slightly different depending on where
you generate your templates.

```typescript
import { createTestServer } from '../.wundergraph/generated/testing';

// Imports from Jest
import { describe, expect, test } from '@jest/globals';
```

We recommended creating as few testing server instances as possible and sharing them between
multiple tests. These minimizes the number of times the server starts and stops, making your tests
faster.

```typescript
const wg = createTestServer();
```

Use Jest's `beforeAll()` and `afterAll()`, to set up the test server:

```typescript
beforeAll(() => wg.start());
afterAll(() => wg.stop());
```

Finally, define your tests as Jest test functions:

```typescript
test('continents', async () => {
  // Use the TypeScript client to perform queries or mutations against your API
  const result = await wg.client().query({
    operationName: 'Continents',
  })
  // Use Jest for assertions
  expect(result.data?.countries_continents.length).toBe(7)
})

test('country by code', async () => {
    // Use the TypeScript client to perform queries or mutations against your API
    const result = await wg.client().query({
      operationName: 'Countries',
      input: {
        filter: {
          code: { eq: 'AD' },
        },
      },
    })
    const andorra = result.data?.countries_countries[0]
    // Use Jest for assertions
    expect(andorra?.name).toBe('Andorra')
  })
)
```

If you'd like to see a full example using Jest for testing, check our [simple example](https://github.com/wundergraph/wundergraph/tree/main/examples/simple).

### Testing with Ava

Create your test file and import `createTestServer` from `./.wundergraph/generated/testing`. Note
that depending on your project's settings, the path might be slightly different depending on where
you generate your templates.

```typescript
import { createTestServer } from '../.wundergraph/generated/testing';

// Imports from Ava
import { test } from 'ava';
```

We recommended creating as few testing server instances as possible and sharing them between
multiple tests. These minimizes the number of times the server starts and stops, making your tests
faster.

```typescript
const wg = createTestServer();
```

Use Ava's `test.before()` and `test.after()` functions to setup our testing server:

```typescript
test.before(() => wg.start());
test.after(() => wg.stop());
```

Finally, define your functions:

```typescript
test('create a note', async (t) => {
  // Use the TypeScript client to perform queries or mutations against your API
  const result = await wg.client().mutate({
    operationName: 'NewNote',
    input: {
      text: 'my first note',
    },
  });
  // Use Ava for assertions
  t.falsy(result.error);
  t.not(result.data?.notes_newNote?.id ?? 0, 0, 'new note id should not be zero');
});
```

## Loading Environment Variables

WunderGraph has builtin support for loading environment variables from a `.env` file. For testing, we recommend creating a `.env.test` file to set the environment variables for the test environment. This allows you to set the environment variables for the test environment without affecting your local development environment.
The test server search first for a `.env.test` file, and if it doesn't exist, it will fall back to `.env`. You can also pass environment variables to the test server with the `env` option of the `createTestServer` method.
None of these files should be committed to git. In your CI, you should use plain environment variables that come from your secret store.
