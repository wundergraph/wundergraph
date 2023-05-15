---
title: Node.js / TypeScript support
description: WunderGraph is the easiest way to consume (GraphQL, REST, ...) APIs in Node.js / TypeScript.
---

The core language for WunderGraph users is TypeScript.
The configuration of a WunderGraph application is written in TypeScript,
you can write type-safe hooks in TS,
and even the generated clients are written in TypeScript.

We believe that TypeScript is the number one language to reach a wide audience.
TypeScript, compiled to JavaScript, is becoming the de-facto standard for web development.

With WunderGraph, you can manage the full stack of your application in TypeScript.

Here's the simplest example of using the generated TypeScript client in Node.js.
Let's assume the following GraphQL mutation:

```graphql
# .wundergraph/operations/CreateUser.graphql
mutation ($input: CreateUserInput!) {
  createUser: user_createUser(input: $input) {
    id
    name
    bio
    email
  }
}
```

WunderGraph will automatically "compile" this Operation into a JSON-RPC API,
and generate a TypeScript client for you,
which we can call from our Node.js application.

```ts
import { createClient } from '../components/generated/client';

const createUser = async () => {
  const client = createClient();
  const out = await client.mutate({
    operationName: 'CreateUser',
    input: {
      name: 'Jens',
      bio: 'Founder@WunderGraph',
      email: 'jens@wundergraph.com',
    },
  });
  console.dir(out);
};

createUser();
```
