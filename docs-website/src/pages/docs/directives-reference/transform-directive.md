---
title: '@transform Directive'
description: Transform the response of a field
---

One of the issues when using the `_join` field is that the response will have more nesting than necessary.
This is because the `_join ` field adds a new, nested, Query type into the response.
With the additional root field that is required to add a nested Query, that's two levels of nesting.

Have a look at the following example:

```graphql
query ($code: ID!, $capital: String! @internal) {
  country: countries_country(code: $code) {
    code
    name
    capital @export(as: "capital")
    weather: _join @transform(get: "weather_getCityByName.weather") {
      weather_getCityByName(name: $capital) {
        weather {
          summary {
            title
            description
          }
          temperature {
            actual
          }
        }
      }
    }
  }
}
```

We're joining weather data with the country data.
Without the transform directive, the response would look like this:

```json
{
  "data": {
    "country": {
      "code": "GB",
      "name": "United Kingdom",
      "capital": "London",
      "weather": {
        "weather_getCityByName": {
          "weather": {
            "summary": {
              "title": "Clouds",
              "description": "overcast clouds"
            },
            "temperature": {
              "actual": 280.64
            }
          }
        }
      }
    }
  }
}
```

The path to the weather data is data > country > weather > weather_getCityByName > weather,
two levels of unnecessary nesting.

## The `get` argument

Using the `@transform` directive with the `get` argument, we can unnest the data and get the following response:

```json
{
  "data": {
    "country": {
      "code": "GB",
      "name": "United Kingdom",
      "capital": "London",
      "weather": {
        "summary": {
          "title": "Clouds",
          "description": "overcast clouds"
        },
        "temperature": {
          "actual": 280.64
        }
      }
    }
  }
}
```

The `get` argument allows us to define a JSON path to extract a nested field from the response.
All unnecessary nesting is removed, and we've got a clean API surface.

As an extra bonus,
the directive will automatically modify the JSON-Schema for the response models.
That is, the "response rewrite" will be reflected in the generated code.
