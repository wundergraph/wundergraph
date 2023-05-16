---
title: Automatic Content Revalidation with ETags
description: WunderGraph automatically generates ETags for each Query and Mutation, making it possible to leverage the power of the browser.
---

As you've learned in the previous section, WunderGraph automatically turns GraphQL Operations into JSON-RPC Endpoints.
We've explained in-depth why this is super powerful.
However, there's one more aspect that is so important that we'd like to dedicate a full section on this one.

To set the stage, let's look at our example Query again:

```graphql
query TopProducts {
  topProducts {
    upc
    name
    price
  }
}
```

The generated Endpoint for this Query will look like this:

```shell
curl http://localhost:9111/TopProducts
```

Amongst all the reasons we've discussed in the [previous](/docs/features/graphql-to-json-rpc-compiler) section, there's one important aspect we'd like to highlight.

> Each Operation gets a unique endpoint (URI/URL)

What's so special about it?

Browsers do some very powerful stuff if each "Resource" has a unique URI.
GraphQL in contrast has just a single endpoint, making it impossible to leverage the power of the browsers.

How does WunderGraph leverage this?

First, we generate [ETags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) for all responses.
That is, we're sending an ETag header alongside the response for each Query.
The next time, the client makes the same request to the same endpoint, it's going to send a "If-None-Match" header.
If this header matches the existing ETag,
which we revalidate on the WunderNode,
we simply return a 304 "Not Modified" response.
This saves bandwidth, time and compute, making client-side revalidation of content very cheap.

Second, we can use standard Cache-Control headers to instruct the client to cache data.
In combination with ETags and the stale-while-revalidate directive,
that makes for a very powerful caching solution,
leveraging the full power of browsers.

This makes complex client-side caching obsolete.
No normalized caches are required, as cache invalidation is cheap.
The client can be a lot less complex and therefore super lightweight.

With all that being said, some applications have requirements that go beyond what powerful cache invalidation can offer.
We're talking about realtime applications. Read more about it in the next section.
