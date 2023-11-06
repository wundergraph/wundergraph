---
title: Auto-generated Operations reference
description: Reference for the auto-generated Operations feature.
hideTableOfContents: true
fullWidthContent: true
isIndexFile: true
---

## Use cases for auto-generated Operations

Some of our users import a lot of data sources into WunderGraph.
Especially with REST/OpenAPI data sources, there might be a lot of endpoints.
If you intention is to re-export 90% of all endpoints as is, and only change a few of them,
the auto-generated Operations feature reduces the amount of work you have to do.

## How it works

You'll define a configuration using TypeScript to filter all "root fields" on your Virtual Graph.
E.g. you can configure that you want to include/exclude certain API Namespaces and then add filters for the root fields.
This generates a list of Operations that will be auto generated.

For each API Namespace, we'll generate a directory underneath `.wundergraph/operations/{API_NAMESPACE}`.
Operations will be named after the root field name.
By default, WunderGraph generates Operations avoiding recursion and internal fields like `__typename`.

## Example configuration

```typescript
// .wundergraph/wundergraph.generate.ts
import { configureWunderGraphGeneration } from '@wundergraph/sdk';

export default configureWunderGraphGeneration({
  codeGenerators: [], // abbreviated for brevity
  operationsGenerator: (config) => {
    // include all root fields from the "weather" & "federated" API Namespace
    config.includeNamespaces('weather', 'federated');
    // we could also exclude the root field "me" from the "federated" API Namespace
    config.filterRootFields(
      (field) => field.operationType === 'query' && field.apiNamespace === 'federated' && field.name === 'me'
    );
  },
});
```

```typescript
import { configureWunderGraphApplication, introspect } from '@wundergraph/sdk';
import generate from './wundergraph.generate';

const federated = introspect.federation({
  apiNamespace: 'federated',
  upstreams: [
    {
      url: 'https://wg-federation-demo-accounts.fly.dev/graphql',
    },
    {
      url: 'https://wg-federation-demo-products.fly.dev/graphql',
    },
    {
      url: 'https://wg-federation-demo-reviews.fly.dev/graphql',
    },
    {
      url: 'https://wg-federation-demo-inventory.fly.dev/graphql',
    },
  ],
});

const weather = introspect.graphql({
  apiNamespace: 'weather',
  url: 'https://weather-api.wundergraph.com/',
  introspection: {
    pollingIntervalSeconds: 5,
  },
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
  apis: [weather, federated],
  generate,
});
```

## Customization of auto-generated Operations

Here's an example of how a generated Operation looks like:

```graphql
# This file is auto generated.
# Remove/modify this header if you want to customize the operation.
query federated_me_query {
  federated_me {
    id
    name
    username
  }
}
```

You'll notice that the Operation has a header that tells you that it's auto-generated.
If you wish to customize this Operation, simply remove or modify this header.
If you keep the header, WunderGraph will override your changes on save.

## Deletion of auto-generated Operations

Each time you change the generation configuration,
WunderGraph will create a list of files that have been generated in `.wundergraph/generated/generate.operations.json`.

When you change the generation configuration,
WunderGraph will diff the list of files that have been previously generated and the files that have been generated from the updated configuration.
It will then automatically delete all files detected as "deleted",
as well as delete empty directories.

If you modified/deleted the "header" of an auto-generated Operation,
WunderGraph will not delete the file automatically.
You'll have to delete the file manually if the file is no longer needed.
