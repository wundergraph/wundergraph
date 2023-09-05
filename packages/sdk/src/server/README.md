# WunderGraph SDK Server

This directory contains the server implementation of the WunderGraph SDK. It's exported through `@wundergraph/sdk/server`.

> **Note**: In order to reduce the bundle size and dependencies, the server implementation must not import packages from the regular SDK. We rather re-export shared components from individual files, than pointing to a [Barrel](https://basarat.gitbook.io/typescript/main-1/barrel) file.

## Usage

```ts
// wundergraph.server.ts

import { configureWunderGraphServer, GithubWebhookVerifier, EnvironmentVariable } from '@wundergraph/sdk/server';

export default configureWunderGraphServer(() => ({
  webhooks: {
    github: {
      verifier: GithubWebhookVerifier(new EnvironmentVariable('GITHUB_SECRET')),
    },
  },
  hooks: {},
  graphqlServers: [],
}));
```
