---
title: NATS KV Datasource
pageTitle: WunderGraph KV
description: An overview of the nats kv datasource
fullWidthContent: true
isIndexFile: true
---

Key-Value Store (KV) feature introduced in the NATS messaging system. The Key-Value Store in NATS provides a distributed storage system where data can be stored and accessed using a simple key-value interface. It is built on top of the core NATS messaging infrastructure, which means it inherits the same principles of speed, scalability, and reliability that NATS is known for. Read more [here](https://docs.nats.io/using-nats/developer/develop_jetstream/kv).

This can now serve as a datasource for WunderGraph.

## Parameters

- `serverURL` (string, optional): The endpoint for your NATS server. Defaults to nats://localhost:4222 for the embedded test server.

- `token` (string, optional): The authorization token for your NATS server.

- `apiNamespace` (string): The namespace to be used for the datasource

- `model` (Zod schema): The model is defined using Zod, a TypeScript-first schema declaration library. It describes the shape of the data to be stored in the NATS KV.

- `history` (number): The history parameter specifies the number of past revisions of the kv store that can be accessed.

## How it works

1. `introspect.natsKV` takes the provided Zod model and creates a GraphQL schema based on it, so the NATS KV service can interact with the data in a standardized way.

2. The generated GraphQL schema allows clients to perform all supported operations [here](https://docs.nats.io/using-nats/developer/develop_jetstream/kv).

## Example Usage

```javascript
const kv = introspect.natsKV({
  apiNamespace: 'kv',
  model: z.object({
    token: z.string(),
  }),
  history: 10,
});
```

## Local Development and Testing

By default WunderGraph runs a test server of NATS for development purposes with the endpoint nats://localhost:4222. It is recommended to disable this in production using `WG_DISABLE_EMBEDDED_NATS=true`. This is automatically set and disabled on WunderGraph Cloud.
