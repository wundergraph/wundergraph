---
title: React.js support
description: WunderGraph is the easiest way to consume all kinds of APIs (GraphQL, REST, gRPC, Kafka, etc...) in React.js.
---

WunderGraph has official support for React.js and Next.js.

What's more, we're not just supporting React,
but also integrate with state management libraries like SWR and React Query / Tanstack Query.

All WunderGraph React integrations are pluggable,
and you're free to choose the integration that fits your needs best.
You can stay very low level and just use the generated TypeScript client,
or you use a higher level integration, like SWR with NextJS and Server Side Rendering.

It's also possible to just use fetch and combine it with the generated TypeScript models.
Have a look at the WunderGraph Protocol to learn more about using the JSON-RPC API directly.

That said, the easiest way to use WunderGraph in React is by using the SWR integration.

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
and generate a TypeSafe SWR hook for you,
which we can call from our React component/Next.js page.

```typescript jsx
// pages/index.tsx
const LiveWeather = () => {
  const liveWeather = useQuery({
    operationName: 'Weather',
    input: { forCity: 'Berlin' },
    liveQuery: true,
  });
  return (
    <div>
      <div>
        <h3>City: {liveWeather.data?.weather?.name}</h3>
        <p>{JSON.stringify(liveWeather.data?.weather?.coord)}</p>
        <h3>Temperature</h3>
        <p>{JSON.stringify(liveWeather.data?.weather?.temperature)}</p>
        <h3>Wind</h3>
        <p>{JSON.stringify(liveWeather.data?.weather?.wind)}</p>
      </div>
    </div>
  );
};

export default withWunderGraph(LiveWeather);
```

By wrapping the page using `withWunderGraph`,
we're enabling SSR (Server Side Rendering) automatically.

You've heard that right, this page, although it's a live query, will be rendered on the server.
Once the client picks up the page, it will automatically subscribe to the live query.
This works as well for GraphQL Subscriptions, Kafka Streams, and any other live query.
But in this case, we're simply using server-side polling to get the latest weather data.

## Pure React

Note that although most of our examples use Next.js,
you can also use WunderGraph in pure React.
Have a look at the [SWR integration](https://github.com/wundergraph/wundergraph/blob/main/packages/SWR/README.md),
it does not depend on Next.js.
You can use it with Vite, Create React App, or any other React project.

## Examples

If you're interested in trying out WunderGraph with React,
have a look at the following examples:

- [Vite + SWR](https://github.com/wundergraph/wundergraph/tree/main/examples/vite-swr)
- [Next.js + React Query](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs-react-query)
- [FaunaDB + Next.js](https://github.com/wundergraph/wundergraph/tree/main/examples/faunadb-nextjs)
- [Next.js + PostgreSQL + Prisma](https://github.com/wundergraph/wundergraph/tree/main/examples/nextjs-postgres-prisma)

If you've got any questions,
please [join our Discord community](https://wundergraph.com/discord) or [contact us](https://wundergraph.com/contact/sales).
