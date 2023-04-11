---
title: SvelteKit + Svelte Query Example
pageTitle: WunderGraph - Examples - SvelteKit - Svelte Query
description:
---

The [SvelteKit example](https://github.com/wundergraph/wundergraph/tree/main/examples/sveltekit) demonstrates the power of
code generation,
when it comes to integrating WunderGraph with frontend frameworks like Svelte.

The SvelteKit example uses the [WunderGraph Svelte Query](/docs/clients-reference/svelte-query) package

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
  codeGenerators: [
    {
      templates: [...templates.typescript.all],
      path: '../src/lib/.wundergraph/generated',
    },
  ],
});
```

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

## Use from Svelte

Your operations will be compiled into RPC endpoints. The template will generate TypeScript client, using which we can create Svelte Query client utilities

```ts
import { createSvelteClient } from '@wundergraph/svelte-query';
import { createClient } from '../generated/client';
import type { Operations } from '../generated/client';

const client = createClient(); // Typesafe WunderGraph client

// These utility functions needs to be imported into your app
export const { createQuery, createFileUpload, createMutation, createSubscription, getAuth, getUser, queryKey } =
  createSvelteClient<Operations>(client);
```

In Svelte component,

```svelte
<script lang="ts">
  import { createQuery } from '$lib/wundergraph';

  const dragonsQuery = createQuery({
    operationName: 'Dragons',
  });
</script>

<div class="results">
  {#if $dragonsQuery.isLoading}
    <p>Loading...</p>
  {:else if $dragonsQuery.error}
    <pre>Error: {JSON.stringify($dragonsQuery.error, null, 2)}</pre>
  {:else}
    <pre>{JSON.stringify($dragonsQuery.data, null, 2)}</pre>
  {/if}
</div>
```

## SSR

If you are working with SvelteKit, this package provides `prefetchQuery` utility to help with SSR

```ts
export const load: PageLoad = async ({ parent }) => {
  const { queryClient } = await parent();

  await prefetchQuery(
    {
      operationName: 'Dragons',
    },
    queryClient
  );
};
```

This implementation is based on TanStack Svelte Query's [prefetchQuery](https://tanstack.com/query/v4/docs/svelte/ssr#using-prefetchquery) approach

## Learn more

- [Guides](/docs/guides)
- [Svelte Query client documentation](/docs/clients-reference/svelte-query)

## Deploy to WunderGraph Cloud

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=vite-svelte)
