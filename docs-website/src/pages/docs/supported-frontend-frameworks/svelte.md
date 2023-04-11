---
title: Svelte
pageTitle: WunderGraph - Svelte
description: WunderGraph is the easiest way to consume all kinds of APIs (GraphQL, REST, gRPC, Kafka, etc...) in Svelte.
---

WunderGraph has official support for Svelte and SvelteKit

We have added support for Svelte, using Tanstack's Svelte Query.

You can stay very low level and just use the generated TypeScript client,
or you use Svelte Query which also supports Server Side Rendering.

It's also possible to just use fetch and combine it with the generated TypeScript models.
Have a look at the WunderGraph Protocol to learn more about using the JSON-RPC API directly.

That said, the easiest way to use WunderGraph in Svelte is by using the Svelte Query integration.

Let's assume, we've defined a virtual Graph with a Weather API and defined an operation to get the current weather for a given city.
Here's how the integration would look like.

First, let's define the Operation in our virtual Graph.

```graphql
# .wundergraph/operations/Weather.graphql
query ($forCity: String!) {
  weather: weather_getCityByName(name: $forCity) @transform(get: "weather") {
    # we're using the @transform directive to flatten the response
    weather {
      summary {
        title
        description
        icon
      }
      temperature {
        actual
        min
        max
      }
    }
  }
}
```

WunderGraph will automatically "compile" this Operation into a JSON-RPC API,
and generate a TypeSafe Svelte Query function,
which we can call from our Svelte page.

```svelte
<script lang="ts">
  const liveWeather = createQuery({
    operationName: 'Weather',
    input: { forCity: 'Berlin' },
    liveQuery: true,
  });
</script>

<div>
  <div>
    <h3>City: {$liveWeather.data?.weather?.name}</h3>
    <p>{JSON.stringify($liveWeather.data?.weather?.coord)}</p>
    <h3>Temperature</h3>
    <p>{JSON.stringify($liveWeather.data?.weather?.temperature)}</p>
    <h3>Wind</h3>
    <p>{JSON.stringify($liveWeather.data?.weather?.wind)}</p>
  </div>
</div>
```

## Examples

If you're interested in trying out WunderGraph with Svelte,
have a look at the following examples:

- [Vite + Svelte](https://github.com/wundergraph/wundergraph/tree/main/examples/vite-svelte)
- [SvelteKit](https://github.com/wundergraph/wundergraph/tree/main/examples/sveltekit)

If you've got any questions,
please [join our Discord community](https://wundergraph.com/discord) or [contact us](https://wundergraph.com/contact/sales).
