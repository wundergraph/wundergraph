---
title: API Composition and Integration
description: Use WunderGraph to compose and integrate APIs
---

One of the motivations of starting to build WunderGraph was that we've found ourselves in a situation where we had to compose a lot of APIs together.

What usually happens in larger organizations is that over time,
you're growing a landscape of APIs, internal and external ones.
There might be some API governance,
but most of the time, it's an organically grown system of various API styles,
different languages, frameworks, protocols, etc...

When a project manager comes up with a new idea,
you have to quickly cobble together all the APIs that are required for this particular use case.

The problem is that this whole mess of APIs doesn't really fit together.
You have to translate protocols, map types, etc...

Even worse, you've now introduced a new API facade that also needs to be maintained.
If one of your APIs changes, you have to update the facade as well.

We've asked ourselves,
is there an easier way to compose APIs?

## The Virtual Graph - A new way to think about APIs

What we've come up as a solution to the problem is what we call the "Virtual Graph".

We've built an open source SDK that introspects various data sources,
like GraphQL, Apollo Federation, OpenAPI, gRPC, PostgreSQL, MySQL, etc...

Once introspected, we translate all these introspections into a GraphQL Schema.
Next, we put each of the APIs into their own namespace,
which is done using our Namespacing feature.

Being able to namespace APIs is a core essential capability to be able to automatically compose APIs.
Without namespacing, you'd easily run into naming collisions,
e.g. when two APIs have the same type `User`, but mean a different thing,
with different fields, etc...

Once the namespacing is applied,
WunderGraph merges all the Schemas together,
the result is the Virtual Graph.

It's called virtual, because this API doesn't really exist.
It's only a virtual facade.

Once this layer is established,
developers can talk to all the services added to the virtual graph,
as if they were talking to a single API.
It's all just GraphQL,
even though the underlying APIs are different.

## Docker, but for APIs

Once you define your GraphQL Operations against this virtual graph,
WunderGraph will compile them into JSON RPC Endpoints,
which will be mounted on the WunderGraph Server (WunderNode).

You can add custom middleware using TypeScript,
and we'll also generate type-safe clients for the generated JSON RPC API.

The result is that we've pretty much abstracted away the complexity of API composition.

Do you remember the times when we didn't have Docker?
When you wanted to try out a new piece of software,
you've had to manually install it onto your machine.
If dependencies were required, you'd have to manually install them as well.

Then came Docker, and you can simply run `docker-compose up`,
and a full stack of services will be running.

Compare this to how most of us compose and integrate APIs nowadays,
and we're back to the pre-Docker era in terms of containerization.
It's all manual wiring, like in the old days when you made a phone call.
Someone had to manually connect a wire between two sockets.
That's exactly how we're composing APIs today.

Now compare this to the WunderGraph approach.
First, let's define two API dependencies:

```typescript
// wundergraph.config.ts
const weather = introspect.graphql({
  apiNamespace: 'weather',
  url: 'https://weather-api.wundergraph.com/',
});

const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});
```

The virtual graph will be automatically generated,
so we can start composing right away:

```graphql
query (
  $continent: String!
  # the @internal directive removes the $capital variable from the public API
  # this means, the user can't set it manually
  # this variable is our JOIN key
  $capital: String! @internal
) {
  countries_countries(filter: { continent: { eq: $continent } }) {
    code
    name
    # using the @export directive, we can export the value of the field `capital` into the JOIN key ($capital)
    capital @export(as: "capital")
    # the _join field returns the type Query!
    # it exists on every object type so you can everywhere in your Query documents
    _join {
      # once we're inside the _join field, we can use the $capital variable to join the weather API
      weather_getCityByName(name: $capital) {
        weather {
          temperature {
            max
          }
          summary {
            title
            description
          }
        }
      }
    }
  }
}
```

That's it! We've now created a new API that joins country data with weather data,
simply by defining two API dependencies and a GraphQL query.

Doesn't this look similar to docker compose?

Our goal is to make it as easy as possible to connect any number of APIs together.
The key ingredient for companies to grow is the ability to easily share and compose APIs.
It helps you to break silos and makes business capabilities more accessible,
to other teams as well as external partners.

All of this contributes to an exponentially growing ecosystem of APIs.
Composing APIs means building on top of existing business capabilities.
Stacking APIs on top of each other,
like composing country and weather data,
enables new use cases,
which creates even more opportunities for business growth.

What if all your systems could speak the same language?
What if you could easily talk to all your infrastructure,
as if it was a single API?

Docker was really just the beginning.
The whole containerization era got rolling when Kubernetes was introduced.

In terms of APIs,
we're right at the start of the API composition era.
