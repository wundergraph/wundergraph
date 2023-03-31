# WunderGraph Svelte Query Integration

![wunderctl](https://img.shields.io/npm/v/@wundergraph/svelte-query.svg)

This package provides a type-safe integration of [@tanstack/svelte-query](https://tanstack.com/query/latest/docs/svelte/overview) with WunderGraph.
Svelte Query is a data fetching library for Svelte apps. With simple utilities, you can significantly simplify the data fetching logic in your project. And it also covered in all aspects of speed, correctness, and stability to help you build better experiences.

> **Warning**: Only works with WunderGraph.

## Getting Started

```shell
npm install @wundergraph/svelte-query @tanstack/svelte-query
```

Before you can use the utilities, you need to modify your code generation to include the base typescript client.

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

Now you can use the utility functions.

```ts
import { createSvelteClient } from '@wundergraph/svelte-query';
import { createClient } from '../generated/client';
import type { Operations } from '../generated/client';

const client = createClient(); // Typesafe WunderGraph client

// These utility functions needs to be imported into your app
export const { createQuery, createFileUpload, createMutation, createSubscription, getAuth, getUser, queryKey } =
  createSvelteClient<Operations>(client);
```

Now, in your svelte layout setup Svelte Query Provider such that it is always wrapping above the rest of the app.

```svelte
<script>
	import Header from './Header.svelte';
	import { browser } from '$app/environment'
	import './styles.css';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				enabled: browser,
			},
		},
	})
</script>

<div class="app">
  <QueryClientProvider client={queryClient}>
    <slot />
  </QueryClientProvider>
</div>
```

Now you can use svelte-query to call your wundergraph operations!

```svelte
<script lang="ts">
	import { createQuery } from '../lib/wundergraph';

	const query = createQuery({
		operationName: "Starwars",
	})
</script>

<div class="counter">
	<h1>Simple Query</h1>
	<div>
		{#if $query.isLoading}
			Loading...
		{/if}
		{#if $query.error}
			An error has occurred:
			{$query.error.message}
		{/if}
		{#if $query.isSuccess}
      <div>
        <pre>{JSON.stringify($query.data.starwars_allPeople)}</pre>
      </div>
    {/if}
	</div>
</div>
```

## Options

You can use all available options from [Svelte Query](https://tanstack.com/query/latest/docs/svelte/overview) with the generated functions.
Due to the fact that we use the operationName + variables as **key**, you can't use the `key` option as usual.
In order to use conditional-fetching you can use the `enabled` option.

## Global Configuration

You can configure the utilities globally by using the Svelte Query's [QueryClient](https://tanstack.com/query/v4/docs/react/reference/QueryClient) config.
