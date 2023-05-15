---
title: The _join field explained
description: The _join field allows you to join data from multiple GraphQL APIs
---

It's quite likely that you've already seen the `_join` field in one of the examples.
This section will explain how it works and how you can use it.

Let's start by looking at an example.
Below is a GraphQL Query that we use in other examples as well.
It fetches the countries from a country API,
and then "joins" the response with weather information.

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

## How the \_join field works

You might have noticed that the `_join` field actually exists on all object types.
That's specific to WunderGraph, we've simply added it.
The return value of the field is the type Query!

In addition to adding it to the Schema,
we're also automatically attaching a data source / resolver to all `_join` fields.
This is just another data source, like REST or GraphQL,
but it's a bit different.
It's a simple static data source that returns an empty object.

So, what happens at execution time when you're using the `_join` field?
We're simply embedding another Query root into the enclosing GraphQL Operation.
Through the use of the `@export` directive,
we can export the value of an enclosing field into a variable,
making it available as a parameter to the nested Query.
