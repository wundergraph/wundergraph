---
title: Signing Origin Requests
pageTitle: WunderGraph - Signing Origin Requests
description: This guide helps you to sign requests before they are sent to the Origin
---

One of our customers recently asked us how they could sign their requests.
We've investigated this and learned that when you're making unauthenticated requests against an origin like AWS Appsync,
you have to use the AWS SDK to sign the request.

Based on their use case, there might be two different cases:

1. A user of their application is authenticated, in which case they send a Bearer token in the Authorization header.
2. The "backend" is actually making the request, so there's no JWT in the Authorization header.

In the first case, the Authorization header should not be altered.
In the second case, as the request is unauthenticated, it needs to be signed using the AWS SDK.

Our intention to solve this problem was to build a very generic solution to modify the Request-Response chain,
so that our users can use any signing algorithm they want or use the solution for other purposes.

So, we've added two new hooks, the onOriginRequest hook as well as the onOriginResponse hook,
both can be used to completely modify the request and response chain.

Here's an example of how the AWS request signing could be implemented:

```typescript
// wundergraph.server.ts

import { configureWunderGraphServer } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient>(() => ({
  hooks: {
    global: {
      httpTransport: {
        onOriginRequest: {
          hook: async ({ request }) => {
            if (request.headers.Authorization) {
              return 'skip'; // no signing required, skip hook and send original request
            }
            return {
              ...request,
              headers: {
                ...request.headers,
                Authorization: `${generateSignature(request)}`,
              },
            };
          },
          enableForOperations: ['AWS_OPERATION'],
        },
      },
    },
  },
}));

const generateSignature = (request: WunderGraphRequest): string => {
  // your algorithm here
  return 'foo';
};
```
