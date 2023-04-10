# create-svelte

Everything you need to build a Svelte project with WunderGraph + SvelteQuery + SSR, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm create svelte@latest

# create a new project in my-app
npm create svelte@latest my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

## Using Wundergraph

### SSR

```ts
// In lib/wundergraph
import { createSvelteClient } from '@wundergraph/svelte-query';
import { createClient } from '../../.wundergraph/generated/client';
import type { Operations } from '../../.wundergraph/generated/client';

const client = createClient();

const { createFileUpload, createMutation, createQuery, createSubscription, getAuth, getUser, queryKey } =
  createSvelteClient<Operations>(client);

export { createFileUpload, createMutation, createQuery, createSubscription, getAuth, getUser, queryKey };
```

```ts
// In +page.ts file
import { prefetchQuery } from '$lib/wundergraph';
import type { PageLoad } from './$types';

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

### Client side

```svelte
<!-- In +page.svelte -->
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

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

[![Deploy to WunderGraph](https://wundergraph.com/button)](https://cloud.wundergraph.com/new/clone?templateName=sveltekit)
