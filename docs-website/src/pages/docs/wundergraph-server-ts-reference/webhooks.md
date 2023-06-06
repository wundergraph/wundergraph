---
title: webhooks configuration
description: Configure webhook verifiers in the WunderGraph server.
---

This property allows you to configure verifiers for your custom webhooks.
Currently, only the `verifier` option is supported.
The `verifier` define how the webhook is verified. Verification is handled by the gateway. Before a webhook can be configured you need to create one. See webhooks feature for more information.

```typescript
// wundergraph.server.ts
import {
  configureWunderGraphServer,
  CreateWebhookVerifier,
  EnvironmentVariable,
  GithubWebhookVerifier,
  WebhookVerifierKind,
} from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
  webhooks: {
    // Enable this if you configure this endpoint on Github.
    // Don't forget to set the environment variable before starting your WunderNode
    github: {
      verifier: GithubWebhookVerifier(new EnvironmentVariable('GITHUB_SECRET')),
    },
    // or generic
    github: {
      verifier: CreateWebhookVerifier({
        kind: WebhookVerifierKind.HMAC_SHA256,
        signatureHeaderPrefix: '',
        secret: new EnvironmentVariable('YOUR_SECRET'),
        signatureHeader: '',
      }),
    },
  },
}));
```
