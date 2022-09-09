# Wundergraph Golang Client

![wunderctl](https://img.shields.io/npm/v/@wundergraph/golang-client.svg)

WunderGraph codegen template plugin to auto-generate a Golang client for your WunderGraph API.

## Getting Started

```shell
npm install @wundergraph/golang-client
```

### Register the codegen template

```ts
// .wundergraph/wundergraph.config.ts
import { golangClient } from '@wundergraph/golang-client';

configureWunderGraphApplication({
  // ...
  // omitted for brevity
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
