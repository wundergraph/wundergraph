---
title: GoLang / Go support
description: WunderGraph supports Golang out of the box.
---

WunderGraph supports Golang out of the box.
For all your Operations, we're able to generate a typesafe GoLang / Go client for you,
including Queries, Mutations, Subscriptions and Live Queries.

## Setup

To use it, follow these steps:

In your `wundergraph.config.ts`, import the golang client generator:

```ts
import { golangClient } from '@wundergraph/golang-client';
```

Then, add it to the `codeGenerators` of `configureWunderGraphApplication`:

```typescript
configureWunderGraphApplication({
  server,
  operations,
  authorization: {
    roles: ['admin', 'user'],
  },
  codeGenerators: [
    {
      templates: [
        ...golangClient.all({
          packageName: 'client',
        }),
      ],
      path: './generated/golang/client',
    },
  ],
});
```

As the path, you can choose any path you like.
Make sure to define a matching `packageName` though.

Finally, add the dependency to your `go.mod` as the generated client depends on it:

```shell
go get https://github.com/wundergraph/client-go
```

## Examples

- [golang-client](https://github.com/wundergraph/wundergraph/tree/main/examples/golang-client)
