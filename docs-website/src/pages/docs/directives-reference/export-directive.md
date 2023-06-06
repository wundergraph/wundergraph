---
title: '@export Directive'
description: Export a value into a variable
---

The `@export` directive can be used to achieve cross-API JOINs.

This section will explain how JOINs work, what specific requirements they have, and what the caveats are.

To achieve a cross-api JOIN, three things are required:

1. you need a variable to store the JOIN key, this variable should be `@internal`
2. you need to use the `@export` directive to export a single value into the JOIN key
3. you have to use the `_join` field to join an object type with another Query result

Let's look at an example to illustrate the flow.

Imagine we'd like to use two APIs to build an API that returns the current weather for all capitals of one of the continents in the world.
To achieve this, we could use the following two APIs:

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

Using these two APIs,
we're ready to configure the JOIN:

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

Our join key, `$capital`, should most likely not be exposed to the public API.
We don't want the user to manipulate our JOIN key.
For that reason, we're using the `@internal` directive to hide it.

Via the `@export` directive, we're exporting the value of the field `capital` into the JOIN key.
The argument `as` is used to specify the name of the exported variable.

Finally, we're using the `_join` field to "embed" another Query into the country object to join the weather data.

## Caveats

WunderGraph executes GraphQL Documents depth-first.
This means that you can only access the JOIN key when the export happened before the \_join field.
In our example, the field `capital` is exported before the `_join` field, so we can access the JOIN key.

Additionally, it's not possible to use the exported variable from within the same "scope".
A scope is the tree of neighbouring fields that query data from the same DataSource.
You can use the `_join` field to create a new scope.
Just make sure that your JOIN key is evaluated before the execution of the \_join field, in depth-first order.
