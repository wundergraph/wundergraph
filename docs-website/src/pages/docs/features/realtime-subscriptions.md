---
title: Realtime Subscriptions
pageTitle: WunderGraph - Features - Realtime Subscriptions
description:
---

Some applications, like e.g. a stockbroker application, might have realtime data requirements.
It's not enough for the client to poll for new data regularly.
Data should be pushed to clients as it becomes available.
WunderGraph offers multiple solutions to this problem.

## GraphQL Subscriptions

Any GraphQL server that supports GraphQL Subscriptions works with WunderGraph out of the box.
There's just one small difference between GraphQL Subscriptions using WunderGraph vs. using a regular GraphQL client.

While most regular GraphQL clients require some extra setup, establishing WebSockets, etc.,
WunderGraph supports Subscriptions out of the box with no extra setup.

Let's look at an example:

```graphql
subscription PriceUpdates {
  updatedPrice {
    upc
    name
    price
    reviews {
      id
      body
    }
  }
}
```

This GraphQL Subscription translates to the following client code:

```typescript jsx
const IndexPage = ({ products }) => {
  const priceUpdate = useSubscription.PriceUpdates() // auto generated
  return <div>{JSON.stringify(priceUpdate)}</div>
}
```

The UI updates automatically as new data becomes available.
No extra client setup, no WebSockets.
Just plain HTTP/2 Streams (or a fallback to chunked encoding) for the folks who are interested in some of the details.

## Apollo Federation GraphQL Subscriptions

Some of you might know Apollo Federation already.
If you don't, no worries, you can skip this section.
For all the others, yes, we support GraphQL Subscriptions for Apollo Federation.

All you have to do is add Subscriptions to your GraphQL Servers (subgraphs) and we do the rest.
Here's a [Demo](https://github.com/wundergraph/wundergraph-demo) if you're interested in trying it out yourself.
