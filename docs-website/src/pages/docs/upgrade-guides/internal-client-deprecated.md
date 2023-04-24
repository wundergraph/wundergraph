---
title: Internal Client deprecated
pageTitle: WunderGraph - Internal Client deprecated
description: The internal client is deprecated and will be superseded by the new operations client.
---

The internal client is deprecated and will be superseded by the new operations client. Removal is planned on the 1st of June.

The operations client is based on the [TypeScript client](/docs/clients-reference/typescript-client) and gives you the same API. Unlike the internal client, it supports Typescript operations and can be used to call internal and public operations.

## Migration

The internal client is used in the following places.

- `wundergraph.server.ts` - Server hooks and GraphQL server context
- `Webhooks` - Webhook handler context
- `TypeScript Operations` - TypeScript operation context

### Queries

```ts
const { data, errors } = ctx.internalClient.queries.Country({
  input: {
    code: 'DE',
  },
});
```

Becomes:

```ts
const { data, error } = ctx.operations.query({
  operationsName: 'Country',
  input: {
    code: 'DE',
  },
});
```

### Mutations

```ts
const { data, errors } = ctx.internalClient.mutations.SetName({
  input: {
    name: 'Elliot',
  },
});
```

Becomes:

```ts
const { data, error } = ctx.operations.mutate({
  operationsName: 'SetName',
  input: {
    name: 'Elliot',
  },
});
```

### Subscriptions

Subscriptions are not supported by the internal client, but can be used with the operations client.

```ts
export default createOperation.subscription({
  handler: async function* ({ operations }) {
    const updates = await operations.subscribe({
      operationName: 'federation/PriceUpdates',
    });
    for await (const update of updates) {
      const data = update.data?.federated_updatedPrice ?? undefined;
      if (!data) {
        continue;
      }
      yield {
        name: data.name,
        upc: data.upc,
        weight: data.weight,
      };
    }
  },
});
```
