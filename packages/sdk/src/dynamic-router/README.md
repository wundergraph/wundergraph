# Dynamic Router

The Dynamic Router integration allows you to rewrite HTTP origin requests on the gateway level.
This enables use cases like:

- Rewriting GraphQL requests to a different GraphQL endpoint
- Inject headers
- Merge multiple requests into one

## Usage

### Basic setup

```typescript
// wundergraph.config.ts
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { dynamicRouter } from '@wundergraph/sdk/dynamic-router';
import { graphql } from '@wundergraph/sdk/datasources';

const router = dynamicRouter({
  match: [
    {
      datasources: ['gql'],
    },
  ],
  handler: async ({ request }) => {
    return fetch(request);
  },
});

export default {
  datasources: [
    graphql({
      namespace: 'gql',
      url: 'https://api.example.com/graphql',
    }),
  ],
  integrations: [router],
} satisfies WunderGraphConfig;
```

```typescript
// wundergraph.server.ts
import { configureWunderGraphServer } from '@wundergraph/sdk';
import config from './wundergraph.config';

export default configureWunderGraphServer(() => ({
  integrations: config.integrations,
  hooks: {
    queries: {},
  },
}));
```

### Injecting headers

```ts
import { dynamicRouter } from '@wundergraph/sdk/dynamic-router';

const router = dynamicRouter({
  match: {
    datasources: ['gql'],
  },
  handler: async ({ request }) => {
    const headers = new Headers(request.headers);
    headers.set('x-custom-header', 'custom-value');

    const body = await request.text();
    const method = request.method;
    return fetch(
      new Request(request.url, {
        ...request,
        headers,
        method: request.method,
        body,
      })
    );
  },
});
```

### Fetch and merge multiple requests

```ts
import { dynamicRouter, mergeGraphQLRequests } from '@wundergraph/sdk/dynamic-router';

const router = dynamicRouter({
  match: {
    datasources: ['gql'],
  },
  handler: async ({ request }) => {
    return mergeGraphQLRequests(request, ['https://server1.org/graphql', 'https://server2.org/graphql']);
  },
});
```

## Configuration properties

| Property  | Type               | Description                                                                                                              |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `match`   | `Match \| Match[]` | A matcher or an array of matchers. An array will trigger the route if one or more matchers in the array match a request. |
| `handler` | `Handler`          | The handler function that is called when a match is found.                                                               |

### Match

| Property        | Type                                      | Description                                    |
| --------------- | ----------------------------------------- | ---------------------------------------------- |
| `datasources`   | `string[]`                                | An array of datasource names to match against. |
| `operationType` | `"query"   \| "mutation"\| "subscription` | The operation type to match.                   |

### Handler

| Property  | Type      | Description                  |
| --------- | --------- | ---------------------------- |
| `request` | `Request` | The original request object. |

## License

The Dynamic Router is licensed under the WunderGraph Community License.
https://github.com/wundergraph/wundergraph/blob/main/LICENSE.COMMUNITY
