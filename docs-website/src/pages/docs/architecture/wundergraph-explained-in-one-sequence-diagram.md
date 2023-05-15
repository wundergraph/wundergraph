---
title: WunderGraph explained in one sequence diagram
description: This page explains how WunderGraph works in one sequence diagram.
---

With this example, our goal is to explain how WunderGraph processes requests,
and how the different middlewares work.

We're assuming that you've got some basic understanding of how to configure WunderGraph.
If not, please have a look at the Architecture Introduction section.

## Data Source Configuration

First, let's add two APIs to our application.

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

configureWunderGraphApplication({
  apis: [weather, countries],
});
```

## Operation Definition

Next, we'll define a GraphQL Operation that uses the Cross API JOIN feature of WunderGraph.
It takes away a lot of complexity,
which is also quite handy to illustrate different capabilities of WunderGraph.

```graphql
# operations/Weather.graphql
query (
  $continent: String!
  # the @internal directive removes the $capital variable from the public API
  # this means, the user can't set it manually
  # this variable is our JOIN key
  $capital: String! @internal
) {
  countries: countries_countries(filter: { continent: { eq: $continent } }) {
    code
    name
    # using the @export directive, we can export the value of the field `capital` into the JOIN key ($capital)
    capital @export(as: "capital")
    # the _join field returns the type Query!
    # it exists on every object type so you can everywhere in your Query documents
    # with the @transform directive, we can transform the response
    weather: _join @transform(get: "weather_getCityByName.weather") {
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

## Resulting Sequence Diagram

![Sequence Diagram](/images/wundergraph_example_swimlanes.png)

### Step-by-step explanation

As WunderGraph uses a GraphQL to JSON RPC compiler,
the client starts by requesting the Resource `/operations/Weather?continent=EU`,
so we're essentially asking to execute the `Weather` operation with the `continent` parameter set to `EU`.

The server will then validate if the user is authenticated (if enabled) and will return 401 if not.
If we've configured Role Based Access Control, the server will also validate if the user has the correct roles.

Once authentication & authorization is validated,
the server will run the input validation,
which compares the input with the generated JSON-Schema definition of the operation.
There's also a [video that explains how the input validation works](https://www.youtube.com/watch?v=_TCU6da0GA8).

Once the input validation is successful,
the server will start by sending the root query to the origin API.
You'll notice that the server automatically rewrites the operation,
e.g. the prefixes from namespacing the API are removed.
Namespacing is a very important feature of WunderGraph,
allowing you to combine APIs without naming conflicts.

Once the response for the countries API is received,
the server will apply some mappings and start iterating over the result.
For each country, the server will send a request to the weather API.

You might be asking, how the `@export` directive works and how we're able to join the country data with the weather data.

While the WunderGraph engine executes the first query,
it will iterate through the country response array and "render" the results.
For each country,
it will render the `code`, `name` and `capital` fields.
When rendering the `capital` field,
the value will be exported into the `$capital` variable.

Next, the engine will try to render the `weather_getCityByName` field.
As we've just populated the `$capital` variable in the enclosing scope,
the engine will use the value from the enclosing `capital` field,
and inject it into the nested query.

Finally, as we've applied the `@transform` directive,
the result of the `weather_getCityByName` query will be transformed into the `weather` field,
removing unnecessary nesting of the `_join` field as well as the `weather_getCityByName` field.

As a result,
we get a clean response returned to the client,
with the join and field mappings already applied.

In addition to simply transforming the response,
the `@transform` directive also modifies the JSON Schema definition for the response,
so the generated client is already aware of the transformations.
