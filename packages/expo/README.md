# WunderGraph Expo Integration

![wunderctl](https://img.shields.io/npm/v/@wundergraph/expo.svg)

Official WunderGraph Expo integration.

## Getting Started

```shell
npm install @wundergraph/expo @wundergraph/swr
```

Before you can use the hooks, you need to modify your code generation to include the base typescript client.

```typescript
// wundergraph.config.ts
configureWunderGraphApplication({
  // ... omitted for brevity
  codeGenerators: [
    {
      templates: [templates.typescript.client],
      // the location where you want to generate the client
      path: '../src/components/generated',
    },
  ],
});
```

Second, run `wunderctl generate` to generate the code.
