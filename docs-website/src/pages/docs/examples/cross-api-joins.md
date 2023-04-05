---
title: Cross-API Joins Example
pageTitle: WunderGraph - Examples - Cross-API Joins
description:
---

[The Cross API Joins example](https://github.com/wundergraph/wundergraph/tree/main/examples/cross-api-joins) shows one of the most powerful features of WunderGraph,
being able to join data from different APIs without having to stitch or federate the APIs.

{% deploy template="cross-api-joins" /%}

## Data source configuration

For this scenario, we need to introspect two APIs,
a weather and a countries GraphQL API:

```typescript
import { configureWunderGraphApplication } from './index';

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

As you can see,
we're using the `apiNamespace` feature of WunderGraph to make sure that there are no naming conflicts between the APIs.

## Configure the Operation

Next, let's configure the Operation.

```graphql
# .wundergraph/CountryWeather.graphql
query ($countryCode: String!, $capital: String! @internal) {
  country: countries_countries(filter: { code: { eq: $countryCode } }) {
    code
    name
    capital @export(as: "capital")
    weather: _join @transform(get: "weather_getCityByName.weather") {
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

This Operation uses the `_join` field to embed a second Query (weather_getCityByName) into the result of the first Query (countries_countries).

The `@internal` directive is used to mark the `$capital` variable as an internal variable,
which means that it will not be exported to the client.

During the execution of the Operation,
the GraphQL engine will first resolve the `countries_countries` Query.
When resolving the `capital` field,
it will export the value into the `$capital` variable.

Then, the GraphQL engine will resolve the `weather_getCityByName` Query using the `$capital` variable.
The result will be added to the result of the `countries_countries` Query as a new field called `weather`.

Finally, we're using the `@transform` directive to flatten the result of the `weather_getCityByName` Query,
removing unnecessary nesting.

## Conclusion

We've just combined two APIs without having to use any glue code.
This Operation is a valid GraphQL Operation and can be defined in your IDE with full type safety.

## Learn more

- [The \_join field explain](/docs/core-concepts/_join-field)

## Deploy to WunderGraph Cloud

The easiest way to deploy your WunderGraph app is to use WunderGraph Cloud.

{% deploy template="cross-api-joins" /%}
