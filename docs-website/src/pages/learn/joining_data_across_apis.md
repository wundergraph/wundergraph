---
title: 'Joining Data Across APIs'
tags: []
date: 2022-01-02
description: ''
layout: 'wg_by_example'
---

In the previous section, we've added 3 API dependencies to our application.
Let's see how we can use the GraphQL Execution Engine of WunderGraph to join data across two APIs.

```graphql
# .wundergraph/operations/ContinentWeather.graphql
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

To call this Operation, we can make the following request:

```shell
curl http://localhost:9991/operations/ContinentWeather?continent=Europe
```

Note how the Variables definition of the GraphQL Operation was turned into a URL query parameter.
What's happening behind the scenes is that WunderGraph "compiles" the GraphQL Operation into a JSON-RPC Endpoint.
The variable definition is then used to generate a JSON Schema for the input parameters, which are mapped to the URL query parameters.
As we've used the `@internal` directive on the `$capital` variable, it's not exposed to the user,
it's just used as an internal placeholder for the JOIN key.

When the WunderGraph execution engine executes the Operation,
it will first execute the `countries_countries` field,
then resolve `code`, `name` and `capital` for each country,
and while resolving `capital`, it will "export" the value of the field into the `$capital` variable,
so we're able to use it inside the `_join` field to join the weather API.

This works inside objects, but also lists.
The only requirement is that the "export" must happen before (above) the join.

One comment on the `_join` field, which might seem a bit odd at first.
It's very simple, let me explain:

When building the Virtual Graph, we're adding a `_join` field to every object type.
The `_join` field is of type `Query!`, which means it's a field that returns the root Query type,
which allows us to nest Queries inside Queries.
As WunderGraph requires a data source for every field, we have to adhere to this rule with a simple "solution".
We add a "static" data source to each `_join` field that returns an empty object.

Joining data across multiple APIs with pure GraphQL is super powerful,
but sometimes it might be a bit limiting.
For such cases, you can use "TypeScript Operations", which give you a lot more flexibility.
We'll see how to use TypeScript Operations in the next section.
