---
title: Authentication-aware data fetching
description: WunderGraph makes data fetching aware of authentication and authorization.
---

As you've read in the previous section, we're already making authenticating users a breeze.
But that's not enough!
We want more.

When we're looking at the API surface of an application, most of the time it's obvious if we're looking at public or user specific data.
We're able to make a clear distinction between data that is available to anonymous users on the one hand and data that is only relevant to the logged-in user.

With that in mind, why are frameworks not offering an easy way to make data fetching aware of this information?

WunderGraph allows you to configure in a declarative way if Operations are for anonymous users or not.
Once configured, the generated client is fully aware of this and updates the UI accordingly.

Let's have a look at a common configuration.

```typescript
const operations: ConfigureOperations = {
  defaultConfig: {
    authentication: {
      required: false,
    },
  },
  queries: (config) => {
    return {
      ...config,
      kind: 'query',
      caching: {
        enable: false,
        public: true,
        maxAge: 10,
        staleWhileRevalidate: 5,
      },
      liveQuery: {
        enable: false,
        pollingIntervalSeconds: 5,
      },
    };
  },
  subscriptions: (config) => ({
    ...config,
    kind: 'subscription',
  }),
  mutations: (config) => ({
    ...config,
    kind: 'mutation',
  }),
  custom: {
    PriceUpdates: (config) => ({
      ...config,
      authentication: {
        required: true,
      },
    }),
  },
};
```

By default, authentication is not required.
However, the Operation `PriceUpdates` requires the user to be authenticated.
Keep in mind that this Operation is a Subscription, so it's updating the UI in real-time.

Here's how you'd use the `PriceUpdates` operation in your application.
You can see that there's nothing specific to it in terms of authentication.
All it does is fetching the data.

```typescript jsx
const IndexPage = () => {
  const priceUpdate = useSubscription.PriceUpdates();
  return <p>{JSON.stringify(priceUpdate)}</p>;
};
```

If the user is authenticated, the PriceUpdates Subscription would fire and continuously update the UI.
If the user logs out, the Subscription will immediately stop and set the UI to a "requires authentication" state.

All this magic is hidden behind `useSubscription.PriceUpdates()` so that all you have to do is configure if authentication is required or not.

Check out the Getting Started Guide if you want to see this in action.

Ok, we have seen that authentication with WunderGraph is supers easy in the last chapter.
This chapter showed authentication aware data fetching, but what about making write operations secure? Read on in the next chapter.
