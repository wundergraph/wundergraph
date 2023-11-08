---
title: Nuxt + Vue Query Example
pageTitle: WunderGraph - Examples - Nuxt - Vue Query
description:
---

[The Nuxt example](https://github.com/wundergraph/wundergraph/tree/main/examples/nuxt) demonstrates the power of
code generation,
when it comes to integrating WunderGraph with frontend frameworks like Nuxt.

## Configuration

Let's start by configuring WunderGraph.

```typescript
// wundergraph.config.ts
const spaceX = introspect.graphql({
  apiNamespace: 'spacex',
  url: 'https://spacex-api.fly.dev/graphql/',
});

configureWunderGraphApplication({
  apis: [spaceX],
  server,
  operations,
  generate: {
    codeGenerators: [
      {
        templates: [templates.typescript.client],
        path: './components/generated',
      },
    ],
  },
});
```

WunderGraph comes with a powerful framework for generating code. In this case, we're generating a generic TypeScript client that we can hook-up with Nuxt.

## Define an Operation

```graphql
# .wundergraph/operations/Dragons.graphql
query Dragons {
  spacex_dragons {
    name
    active
  }
}
```

## Configure Nuxt, Wundergraph and Vue Query

Most of the configuration is done in a Nuxt plugin.

```ts
import type { DehydratedState, VueQueryPluginOptions } from '@tanstack/vue-query';
import { VueQueryPlugin, QueryClient, hydrate, dehydrate } from '@tanstack/vue-query';
import { useState } from '#imports';

import { createHooks } from '@wundergraph/vue-query';
import { createClient, Operations } from '../.wundergraph/components/generated/client';

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query');

  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5000 } },
  });
  const options: VueQueryPluginOptions = { queryClient };

  nuxt.vueApp.use(VueQueryPlugin, options);

  if (process.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient);
    });
  }

  if (process.client) {
    nuxt.hooks.hook('app:created', () => {
      hydrate(queryClient, vueQueryState.value);
    });
  }

  const client = createClient(); // Typesafe WunderGraph client
  const wgraph = createHooks<Operations>(client);
  return {
    provide: {
      wgraph,
    },
  };
});
```

This properly setup Nuxt and Vue Query with server side rendering and hydration of the client.

## Using from Nuxt

You can access the wundergraph client from vue files using the `useNuxtApp` hook and grabbing the property that you provided in the nuxt plugin (prefixed by a `$`).

```html
<script setup>
  const {
    $wgraph: { useQuery },
  } = useNuxtApp();

  const dragons = useQuery({
    operationName: 'Dragons',
  });
</script>
```

Your operations will be compiled into RPC endpoints, so all you have to do is to use the `useQuery` hook and call your newly created API.

## Learn more

- [Guides](/docs/guides)
- [Nuxt client documentation](/docs/clients-reference/nuxt)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com).

{% deploy template="nuxt" /%}
