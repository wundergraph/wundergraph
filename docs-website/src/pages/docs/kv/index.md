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

- `apiNamespace` (string): The namespace to be used for the datasource

- `model` (Zod schema): The model is defined using Zod, a TypeScript-first schema declaration library. It describes the shape of the data to be stored in the NATS KV.

- `history` (number): The history parameter specifies the number of past revisions of the kv store that can be accessed.

## Endpoint and Authentication

The introspection uses two environment variables namely `WG_NATS_URL` for the server endpoint and `WG_NATS_AUTH` for the authentication token.

### Prefixing buckets

Buckets can be prefixed with a custom name. This is also set using the environment variable `WG_NATS_PREFIX`

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

By default WunderGraph runs a test server for NATS. It is recommended to disable this in production using `WG_DISABLE_EMBEDDED_NATS`. This is automatically set on WunderGraph Cloud.
