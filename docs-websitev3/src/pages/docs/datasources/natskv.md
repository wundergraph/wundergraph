---
title: NATS KV DataSource
description: An overview of the NATS KV DataSource
---

# NATS KV DataSource

Key-Value Store (KV) feature introduced in the NATS messaging system. The Key-Value Store in NATS provides a distributed storage system where data can be stored and accessed using a simple key-value interface. It is built on top of the core NATS messaging infrastructure, which means it inherits the same principles of speed, scalability, and reliability that NATS is known for. Read more [here](https://docs.nats.io/using-nats/developer/develop_jetstream/kv).

This can now serve as a datasource for WunderGraph.

## Parameters

- `serverURL` (string, optional): The endpoint for your NATS server. Defaults to nats://localhost:4222 for the embedded test server.

- `token` (string, optional): The authorization token for your NATS server.

- `namespace` (string): The namespace to be used for the datasource

- `model` (Zod schema): The model is defined using Zod, a TypeScript-first schema declaration library. It describes the shape of the data to be stored in the NATS KV.

- `history` (number): The history parameter specifies the number of past revisions of the kv store that can be accessed.

## How it works

1. `natsKV` takes the provided Zod model and creates a GraphQL schema based on it, so the NATS KV service can interact with the data in a standardized way.

2. The generated GraphQL schema allows clients to perform all supported operations [here](https://docs.nats.io/using-nats/developer/develop_jetstream/kv).

## Example Usage

We will go over 4 of the available 11 operations that can be performed over the key value store.

### Setup

First we introspect the key value store and add it to the list of apis

```typescript
import type { WunderGraphConfig } from '@wundergraph/sdk';
import { natsKV } from '@wundergraph/sdk/datasources';

const kv = natsKV({
  namespace: 'kv',
  model: z.object({
    token: z.string(),
  }),
  history: 10,
});

export default {
  datasources: [kv],
} satisfies WunderGraphConfig;
```

### Create

Next define a graphql operation that creates an entry into the key value store

```graphql {% filename="create.graphql" %}
mutation ($key: String!, $value: kv_InputValue!) {
  kv_create(key: $key, value: $value) {
    key
    revision
    created
    value {
      token
    }
  }
}
```

Execute the above operation using the CURL below. If the creation is successful you should get back all the details for the key.

```bash
curl -X POST http://localhost:9991/operations/create  \
  -H "Content-Type: application/json" \
  -d '{
    "key": "hello",
    "value": {
      "token": "world"
    }
  }'
```

### Update

Now let's write a mutation to update the key. It takes a the key, value and revision number that we received from the previous request.

```graphql {% filename="update.graphql" %}
mutation ($key: String!, $value: kv_InputValue!, $revision: Int!) {
  kv_update(key: $key, value: $value, revision: $revision) {
    key
    revision
    created
    value {
      token
    }
  }
}
```

Let us execute it. You should receive a response with the updated value and the new revision number.

```bash
curl -X POST http://localhost:9991/operations/update  \
  -H "Content-Type: application/json" \
  -d '{
    "key": "hello",
    "value": {
      "token": "world updated!"
    },
    "revision": 1
  }'
```

### History

Now that we have updated the key, we can view the revision history.

```graphql {% filename="history.graphql" %}
query ($key: String!) {
  kv_history(key: $key) {
    key
    revision
    created
    value {
      token
    }
  }
}
```

Execute the below CURL request. You should receive a list of revisions.

```bash
curl -X GET http://localhost:9991/operations/kv/history?key=hello
```

### Delete

Finally we can delete the key from the store.

```graphql {% filename="delete.graphql" %}
mutation ($key: String!) {
  kv_delete(key: $key)
}
```

Let us execute it. You should receive a response `{"data":{"kv_delete":true}}`

```bash
curl -X POST http://localhost:9991/operations/delete  \
  -H "Content-Type: application/json" \
  -d '{
    "key": "hello"
  }'
```

## Local Development and Testing

By default WunderGraph runs a test server of NATS for development purposes with the endpoint nats://localhost:4222. It is recommended to disable this in production using `WG_DISABLE_EMBEDDED_NATS=true`. This is automatically set and disabled on WunderGraph Cloud.

## Learn more

- [NATS KV Documentation](https://docs.nats.io/using-nats/developer/develop_jetstream/kv)
- [NATS KV Reference](/reference/datasources/natskv)
