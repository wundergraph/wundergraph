---
title: TypeScript Webhooks
pageTitle: WunderGraph - Features - TypeScript Webhooks
description: TypeScript Webhooks make it easy to integrate third party applications. With WunderGraph, you're able to use TypeScript to make this as easy and secure as possible.
---

During building a public platform, you will run into situations where you need to listen to events from external services to automatically trigger your implementation. One common approach are webhooks.
Webhooks are regular HTTP endpoints that are called by external services. There is no standard how webhooks are triggered or implemented. We provide the most flexible solution for you.
You can implement webhooks in TypeScript using any Node.js package. Webhooks are also deeply integrated in the developer workflow. If you change a file in `wunderctl up` mode, we will hot-reload your webhooks.

For example, you might want to receive message when a User has starred your repository on Github to send him a thank you email with the next steps. With WunderGraph it is very easy to add secure webhooks to your WunderNode. You only need to create a webhook function in `.wundergraph/webhooks`.

```typescript
// .wundergraph/webhooks/github.ts

import type { WebhookHttpEvent, WebhookHttpResponse } from '@wundergraph/sdk/server';
import { createWebhook } from '../generated/wundergraph.webhooks';

export default createWebhook<
  WebhookHttpEvent<{ myBodyVar: string }, { myQueryVar: string }, { myHeaderVar: string }>,
  WebhookHttpResponse<{ myResponseBodyVar: string }, { myResponseHeaderVar: string }>
>({
  handler: async (event, context) => {
    return {
      statusCode: 200,
      headers: {
        myResponseHeaderVar: 'myResponseHeaderValue',
      },
      body: {
        hello: 'github',
      },
    };
  },
});
```

After adding your first webhook, you can test it by calling `http://localhost:9991/webhooks/github`. It should return `{ hello: 'github' }`.

## Access the original client request

You have access to the original client request.

```typescript
// .wundergraph/webhooks/github.ts

import type { Webhook } from '@wundergraph/sdk/server';
import { createWebhook } from '../generated/wundergraph.webhooks';

export default createWebhook({
  handler: async (event, context) => {
    event.body;
    event.url;
    event.headers;
    event.method;
    event.query;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        hello: 'github',
      },
    };
  },
});

export default webhook;
```

## Call internal operations

You can call internal operations from webhooks.

```typescript
// .wundergraph/webhooks/github.ts

import type { Webhook } from '@wundergraph/sdk/server';
import { createWebhook } from '../generated/wundergraph.webhooks';

export default createWebhook({
  handler: async (event, context) => {
    const { data, error } = await context.operations.query({
      operationName: 'Dragons'
    })

    console.log(data);

    return {
      statusCode: 200,
      body: {
        hello: 'github',
      },
    };
  },
};
```

## Configure a verifier for your webhook

Implementing a webhook is more than just adding a HTTP handler to your application. In order to securely integrate Github, we have to ensure that only Github is able to call your endpoint. We can solve that by using webhook verifiers. Almost every platform has different requirements.

### GitHub verifier

For Github, you can use our verifier in the SDK that implements the [validation](https://docs.github.com/en/developers/webhooks-and-events/webhooks/securing-your-webhooks) of the signature without writing any code.

```typescript
// .wundergraph/wundergraph.server.ts

import { configureWunderGraphServer, EnvironmentVariable, GithubWebhookVerifier } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
  webhooks: {
    // Enable this if you configure this endpoint on Github.
    // Don't forget to set the environment variable before starting your WunderNode
    github: {
      verifier: GithubWebhookVerifier(new EnvironmentVariable('GITHUB_SECRET')),
    },
  },
}));
```

### Generic HMAC Verifier

The HMAC validation protocol is also used by other platforms.  
You can use our generic HMAC verifier to validate other webhooks as well.

```typescript
// .wundergraph/wundergraph.server.ts

import { configureWunderGraphServer, EnvironmentVariable, GithubWebhookVerifier } from '@wundergraph/sdk/server';
import type { HooksConfig } from './generated/wundergraph.hooks';
import type { WebhooksConfig } from './generated/wundergraph.webhooks';
import type { InternalClient } from './generated/wundergraph.internal.client';

export default configureWunderGraphServer<HooksConfig, InternalClient, WebhooksConfig>(() => ({
  webhooks: {
    github: {
      verifier: CreateWebhookVerifier({
        kind: WebhookVerifierKind.HMAC_SHA256,
        signatureHeaderPrefix: 'sha256=',
        secret: new EnvironmentVariable('YOUR_SECRET'),
        signatureHeader: 'X-Hub-Signature',
      }),
    },
  },
}));
```

## How to

If you're looking for more specific information on how to configure Webhooks,
have a look at the wundergraph.server.ts reference.

- [Webhooks Configuration reference](/docs/wundergraph-server-reference/webhooks)
