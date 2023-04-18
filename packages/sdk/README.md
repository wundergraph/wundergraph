<div align="center">

# WunderGraph SDK

![wunderctl](https://img.shields.io/npm/v/@wundergraph/sdk.svg)
[![Star us on GitHub](https://img.shields.io/github/stars/wundergraph/wundergraph?color=FFD700&label=Stars&logo=Github)](https://github.com/wundergraph/wundergraph)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/wundergraph/wundergraph/blob/main/CONTRIBUTING.md)
[![License Apache 2](https://img.shields.io/badge/license-Apache%202-blue)](https://github.com/wundergraph/wundergraph/blob/main/LICENSE)
[![Enterprise support](https://img.shields.io/badge/enterprise-support-indigo.svg)](https://form.typeform.com/to/fuRWxErj?typeform-embed-id=8749569972809419&typeform-embed=popup-blank&typeform-source=wundergraph.com&typeform-medium=embed-sdk&typeform-medium-version=next)

[Quickstart](https://docs.wundergraph.com/getting-started)
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
[Website](https://wundergraph.com/)
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
[Docs](https://docs.wundergraph.com/docs)
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
[Examples](https://docs.wundergraph.com/docs/examples)
<span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
[Blog](https://wundergraph.com/blog)

[<img height="300" width="300" src="https://user-images.githubusercontent.com/47415099/214915738-fd34d2ab-7549-4a60-bbdb-ab9f30145341.png">](https://wundergraph.com/)

[![Post on our Discourse forum](https://img.shields.io/discourse/topics?color=fbf5af&label=Discourse&logo=Discourse&server=https%3A%2F%2Fcommunity.wundergraph.com%2F)](https://community.wundergraph.com/)
[![Join our Discord Server](https://img.shields.io/badge/Discord-chat%20with%20us-%235865F2?style=flat&logo=discord&logoColor=%23fff)](https://discord.com/invite/Jjmc8TC)
[![Tweet at us on Twitter](https://img.shields.io/badge/Twitter-tweet%20at%20us-1da1f2?style=flat&logo=twitter&logoColor=%23fff)](https://twitter.com/wundergraphcom)

[Love WunderGraph? Give us a ⭐ on GitHub!](https://github.com/wundergraph/wundergraph)

</div>

## What is WunderGraph?

WunderGraph is a **Backend for Frontend (BFF) Framework** designed to optimize Developer Workflows through API Composition.

At its core, WunderGraph combines two patterns, [API Gateway](https://microservices.io/patterns/apigateway.html) and [BFF](https://samnewman.io/patterns/architectural/bff/)
with the concept of a package manager, making API composition as simple as npm install.
Our mantra is: **Compose, don't integrate**.

**API Composition** is a new pattern that allows you to interact with a heterogeneous set of APIs as if they were a single unified API.
This not just eliminates a lot of glue code, but also allows you to reason about the API Dependencies of an application.
Do you actually know what APIs and Services your application depends on?
WunderGraph can easily answer this question for you,
and even gives you analytics and observability into what APIs and Endpoints are used by your application and what the quality of service your API dependencies provide.

## WunderGraph in a nutshell

Here's how WunderGraph works:

1. **Compose your APIs**

```typescript
// .wundergraph/wundergraph.config.ts

import { NextJsTemplate } from '@wundergraph/nextjs/dist/template';

// introspect a PostgreSQL database
const pg = introspect.postgresql({
  apiNamespace: 'pg',
  databaseURL: new EnvironmentVariable('PG_DATABASE_URL'),
});

// introspect the Stripe API using OpenAPI
const stripe = introspect.openApiV2({
  apiNamespace: 'stripe',
  source: {
    kind: 'file',
    filePath: './stripe.yaml',
  },
  headers: (builder) => builder.addClientRequestHeader('Authorization', `Bearer ${process.env.STRIPE_SECRET_KEY}`),
});

// introspect the Shopify Storefront API using GraphQL
const shopify = introspect.graphql({
  apiNamespace: 'shopify',
  url: 'https://my-shop.myshopify.com/api/2021-07/graphql.json',
  headers: (builder) =>
    builder.addStaticHeader('X-Shopify-Storefront-Access-Token', new EnvironmentVariable('SHOPIFY_STOREFRONT_TOKEN')),
});

configureWunderGraphApplication({
  // compose the APIs into a unified WunderGraph API
  apis: [pg, stripe, shopify],

  // generate type-safe clients for your Frontend
  codeGenerators: [
    {
      templates: [...templates.typescript.all],
    },
    {
      templates: [new NextJsTemplate()],
      path: '../web/components/generated',
    },
  ],
});
```

WunderGraph allows you to create a code pipeline to introspect and compose multiple APIs into a unified API.
This makes it easy to update an API dependency without a single click.

2. **Define an Operation**

By combining the introspected APIs, WunderGraph generates a unified GraphQL Schema across all APIs.
All we have to do is define an Operation and call it from our Frontend.

**GraphQL**

```graphql
# .wundergraph/operations/users/ByID.graphql
query ($id: String!) {
  user: pg_findFirstUser(where: { id: { equals: $id } }) {
    id
    email
    name
    bio
  }
}
```

**TypeScript**

```typescript
// .wundergraph/operations/users/CustomByID.ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
  // Input validation
  input: z.object({
    id: z.string(),
  }),
  handler: async ({ input }) => {
    // Call into your virtual graph, type-safe
    const { errors, data } = await operations.query({
      operationName: 'users/ByID',
      input: {
        id: input.id,
      },
    });

    return {
      ...data,
    };
  },
});
```

3. **Call the Operation** from your Frontend

As you define Operations, WunderGraph automatically generates a type-safe client for your Frontend,
supporting all major Frontend Frameworks like React, NextJS, Remix, Astro, Svelte, Expo, Vue, etc...

```typescript jsx
// web/pages/profile.ts

import { useQuery } from '../../components/generated/nextjs';

export default async function ProfilePage(props) {
  const { data } = await useQuery({
    operationName: 'users/CustomByID', // or 'users/ByID'
    input: {
      id: props.params.id,
    },
  });

  return (
    <div>
      <h1>{data.user.id}</h1>
      <p>{data.user.name}</p>
    </div>
  );
}
```

In the same vein, you could now add Authentication, Authorization, file uploads, etc...

## Getting started

The easiest way to get started from scratch is to use the following command:

```shell
npx create-wundergraph-app my-project --example nextjs
```

If you already have an existing project, you can add WunderGraph to it by running:

```shell
npx create-wundergraph-app --init
```

# Community

Want to chat about **WunderGraph** with the team and other enthusiastic developers like yourself?
We're very active on [our Discord server](https://discord.com/invite/Jjmc8TC)
and on [our GitHub](https://github.com/wundergraph/wundergraph/), where issues and PRs are very welcome
(but please read our [contribution readme](https://github.com/wundergraph/wundergraph/blob/main/CONTRIBUTING.md) first).

Now, the only thing our community is missing is you!

# Support

**Questions?** 🙋

- We're happy to help you with queries on [our Discord server](https://discord.com/invite/Jjmc8TC).

**Bugs?** 🪳

- Tell us about them [on Discord](https://discord.com/invite/Jjmc8TC),
  create a [GitHub issue](https://github.com/wundergraph/wundergraph/issues),
  or even open a [GitHub Pull Request](https://github.com/wundergraph/wundergraph/pulls).

**Need more help or interested in enterprise support?** 🤔

- [Let's chat](https://form.typeform.com/to/fuRWxErj?typeform-embed-id=8749569972809419&typeform-embed=popup-blank&typeform-source=wundergraph.com&typeform-medium=embed-sdk&typeform-medium-version=next),
  and we'll get you exactly what you need.

# Exports

- [@wundergraph/sdk/client](https://github.com/wundergraph/wundergraph/tree/main/packages/sdk/src/client)
- [@wundergraph/sdk/internal](https://github.com/wundergraph/wundergraph/tree/main/packages/sdk/src/internal)
- [@wundergraph/sdk/internal/logger](https://github.com/wundergraph/wundergraph/tree/main/packages/sdk/src/logger)
- [@wundergraph/sdk/server](https://github.com/wundergraph/wundergraph/tree/main/packages/sdk/src/server)
- [@wundergraph/sdk/testing](https://github.com/wundergraph/wundergraph/tree/main/packages/sdk/src/testing)
