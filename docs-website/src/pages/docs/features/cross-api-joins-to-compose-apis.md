---
title: Cross-API Joins to Compose APIs
pageTitle: WunderGraph - Features - Cross-API Joins to Compose APIs
description:
---

Imagine you'd like to access Data from multiple APIs and combine the results into a single dataset.
WunderGraph supports a rich set of DataSources, so we wanted to add a simple way to achieve JOINs across APIs.

## Example: Joining Capitals with Weather Data

Let's say we want to get the weather data for all capitals of a continent.
You'd probably want to add two APIs to your application,
one to query the capitals and the other to query the weather data.

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

Next, let's define our JOIN query.

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

The response looks like this:

```json
{
  "data": {
    "countries_countries": [
      {
        "code": "AD",
        "name": "Andorra",
        "capital": "Andorra la Vella",
        "_join": {
          "weather_getCityByName": {
            "weather": {
              "temperature": {
                "max": 272.24
              },
              "summary": {
                "title": "Snow",
                "description": "light snow"
              }
            }
          }
        }
      },
      {
        "code": "AL",
        "name": "Albania",
        "capital": "Tirana",
        "_join": {
          "weather_getCityByName": {
            "weather": {
              "temperature": {
                "max": 280.64
              },
              "summary": {
                "title": "Clear",
                "description": "clear sky"
              }
            }
          }
        }
      },
      {
        "code": "AT",
        "name": "Austria",
        "capital": "Vienna",
        "_join": {
          "weather_getCityByName": {
            "weather": {
              "temperature": {
                "max": 281.42
              },
              "summary": {
                "title": "Clouds",
                "description": "broken clouds"
              }
            }
          }
        }
      }
    ]
  }
}
```

## The "Magic" behind the JOIN

WunderGraph first queries the countries API to get all the countries of a continent.
Then, it queries the weather API for each capital of the countries.

We're using the `@export` directive to export the value of the field `capital` into the JOIN key ($capital).
Then we're using the `_join` field to join the weather API.

The `_join` field is a special field that exists on every object type.
It simply returns the Query type, so you can join a response of one API with another.

## Reference Documentation

If you want to learn more about how JOINs work,
you can read the reference docs on the `@export` directive,
the `@internal` directive,
as well as the `_join` field.
