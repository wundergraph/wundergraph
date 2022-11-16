# Migration steps

| Version range   | Migration complexity | Info                |
| --------------- | -------------------- | ------------------- |
| swr-0.3.0-0.4.0 | medium               | Updated to SWR 2.0. |

Next.js 0.4.0 has been fully rewritten and now uses SWR to manage client server state.

## Dependencies

SWR is a new peer dependency of `@wundergraph/nextjs`, add it to your project.

`npm i swr@^2.0.0-rc.0`

## Generated code

The generated hooks no longer include named properties for each operation.

```ts
import { withWunderGraph, useQuery, useMutation, useSubscription } from 'generated/nextjs';
```

### useQuery

```ts
const { response, refetch } = useQuery.Weather({
  input: {
    forCity: 'Berlin',
  },
});

// response.data.weather
// response.error

refetch(); // refetch data
```

Becomes:

```ts
const { data, error, mutate } = useQuery({
  operationName: 'Weather',
  input: {
    forCity: 'Berlin',
  },
});

// data.weather

mutate(); // invalidate cache and refetch
```

### useMutation

```ts
const { mutate, response } = useMutation.SetName({
  input: {
    name: 'Rick Astley',
  },
});

mutate();
```

Becomes:

```ts
const { trigger, data, error } = useMutation({
  operationName: 'SetName',
});

trigger({
  name: 'Never gonna give you up',
});
```

### useLiveQuery

useLiveQuery no longer exists, you can pass `liveQuery: true` to useQuery to turn it into a live query (unless live query is disable for a specific query).

```ts
const { data, error } = useQuery({
  operationName: 'Weather',
  input: {
    forCity: 'Berlin',
  },
  liveQuery: true,
});
```

### useSubscription

```ts
const { response, refetch } = useQuery.TopProducts({
  input: {
    limit: 100,
  },
});

// response.data
// response.error
```

Becomes:

```ts
const { data, error, isSubscribed } = useSubscription({
  operationName: 'TopProducts',
  input: {
    limit: 100,
  },
});
```

## SSR

`withWunderGraph` works like before, and will prefetch all data in `getInitialProps`.
The prefetched data is then added to the SWRConfig fallback.

```ts
// _app.text
function App() {
  // ...
}

export default withWunderGraph(App, {
  ssr: true, // true by default
  fetchUserSSR: true, // fetch the user with SSR, true by default
});
```
