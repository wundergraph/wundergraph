---
title: Generated Clients and SDKs
description: WunderGraph generates clients and SDKs for you
---

One pain point of client side API integration is the network client itself.
First, you have to choose one.
You have to make decisions about caching, realtime data fetching, etc...
You probably want type safety, so you have to look at tooling like graphql-code-generator.
If you want to authenticate your users, you're most likely adding another component to handle that.
Different APIs might require different clients, so one single client might not even be enough.

Throughout our careers, we've had the chance to use many client and server frameworks on different platforms and with different languages.
All of them had one thing in common.
Client and Server never fit together perfectly fine and there's always customization required.
If you add authentication to the stack, it usually becomes messy.

Using OpenApi Specification, we never found good client support.
With GraphQL it's a lot better but there's still a lot of room for improvement.

## Start Generating, Stop worrying!

For the reasons explained above, we've taken a different avenue for WunderGraph.
As mentioned in other places, we're using WunderGraph to build WunderGraph.
We didn't want to make yet another messy client side integration where we have to cobble together various open source tools to achieve something that should be simple.

If you've read through the previous sections,
you should be aware that WunderGraph has a lot of information to generate the configuration for the WunderNodes that run your APIs on the Edge.

This is information about the GraphQL schema, all operations including JSON schemas for both variables and the response objects.
We know the available authentication providers.
We know exactly which operation requires authentication and how caching is configured.

All this information is available at compile time.
That's neat, because we can use it to generate the perfect client!

This client will be a 1:1 match to the configured WunderNode
This client is typesafe and required zero configuration.
It's able to authenticate users with the authentication providers you've previously configured.

We're using it ourselves and we're so happy, we don't want to move back to any other client framework.

Here's an extensive example of how using the client might look like:

```typescript jsx
interface Props {
  products?: FakeProductsResponse;
}

const IndexPage: NextPage<Props> = ({ products }) => {
  const { login, logout } = useAuth();
  const user = useUser();
  const fakeProducts = useQuery({
    operationName: 'FakeProducts',
    input: { first: 5 },
    initialState: products,
  });
  const price = useMutation({
    operationName: 'SetPrice',
    input: { price: 0, upc: '1' },
  });
  const priceUpdate = useSubscription({ operationName: 'PriceUpdates' });
  const oasUsers = useQuery({
    operationName: 'OasUsers',
    refetchOnWindowFocus: true,
  });
  const countries = useQuery({ operationName: 'Countries' });
  const liveProducts = useQuery({
    operationName: 'TopProducts',
    liveQuery: true,
  });
  const users = useQuery({ operationName: 'Users' });
  return (
    <div>
      <h1>Hello Wundergraph</h1>
      <h2>User</h2>
      <p>
        {user === undefined && 'user not logged in!'}
        {user !== undefined && `name: ${user.name}, email: ${user.email}`}
      </p>
      <p>
        {user === undefined && <button onClick={() => login.github()}>login</button>}
        {user !== undefined && <button onClick={() => logout()}>logout</button>}
      </p>
      <h2>FakeProducts</h2>
      <p>{JSON.stringify(fakeProducts.response)}</p>
      <button onClick={() => fakeProducts.refetch()}>refetch</button>
      <h2>Set Price</h2>
      <button
        onClick={() => {
          setPrice({ input: { upc: '2', price: randomInt(100) } });
        }}
      >
        Set
      </button>
      <p>{JSON.stringify(price)}</p>
      <h2>Price Updates</h2>
      <p>{JSON.stringify(priceUpdate)}</p>
      <h2>Products LiveQuery</h2>
      <p>{JSON.stringify(liveProducts)}</p>
      <h2>OAS Users</h2>
      <p>{JSON.stringify(oasUsers)}</p>
      <h2>Countries</h2>
      <p>{JSON.stringify(countries)}</p>
      <h2>JSON Placeholder Users</h2>
      <p>{JSON.stringify(users)}</p>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const client = new Client();
  const products = await client.query.FakeProducts({ input: { first: 5 } });
  return {
    props: {
      products: products.status === 'ok' ? products.body : null,
    },
  };
};

const randomInt = (max: number) => Math.floor(Math.random() * Math.floor(max)) + 1;
```

It has everything you might come across.

- server side data fetching
- client side picking up server side data
- queries
- mutations
- subscriptions
- live-queries
- auto-refetching on window focus

We've taken a lot of inspiration from [swr](https://swr.vercel.app/) by Vercel.
