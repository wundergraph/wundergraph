---
title: Astro
pageTitle: WunderGraph - Examples - Astro
description: Example using WunderGraph with Astro
---

[This example](https://github.com/wundergraph/wundergraph/tree/main/examples/astro)) demonstrates how to use WunderGraph with [Astro](https://astro.build/).

## Installation

```
npx create-wundergraph-app --example astro
```

## Configuration

The configuration for WunderGraph is located in the `.wundergraph` directory.

For this example we use the [Countries GraphQL API](https://countries.trevorblades.com/).

```ts {% filename=".wundergraph/wundergraph.config.ts" %}
// ...
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
  apis: [countries],
  // ...
});
```

## Query data

```tsx {% filename="src/pages/index.astro" %}
---
import Layout from '../layouts/Layout.astro';
import Card from '../components/Card.astro';
import { client } from '../lib/wundergraph';

const { data } = await client.query({
	operationName: 'Continents',
})
---

<Layout title="Welcome to Astro.">
	<main>
		<h1>Welcome to <span class="text-gradient">Astro</span> + <span class="text-gradient">WunderGraph</span></h1>
		<p class="instructions">
			To get started, open the directory <code>src/pages</code> in your project.<br />
			<strong>Code Challenge:</strong> Tweak the "Welcome to Astro + WunderGraph" message above.<br /><br />
			<a href="https://docs.wundergraph.com">WunderGraph Docs</a> - <a href="https://docs.astro.build/">Astro Docs</a>
		</p>
		<ul role="list" class="link-card-grid">
			{data && data.countries_continents.map((continent) => (
				<Card
					href={`/continents/${continent.code}`}
					title={continent.name}
					body={continent.name}
				/>
			))}
		</ul>
	</main>
</Layout>
```

## Learn more

- [WunderGraph Client reference](/docs/clients-reference/typescript-client)
- [Astro documentation](https://vitejs.dev)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use [WunderGraph Cloud](https://cloud.wundergraph.com). Enable the [Vercel integration](https://vercel.com/integrations/wundergraph) to deploy the Vite frontend to Vercel.

{% deploy template="astro" /%}
