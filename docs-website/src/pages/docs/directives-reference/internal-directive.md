---
title: '@internal Directive'
description: Mark a field as internal
---

Using the `@export` directive,
it's possible for you to "export" a field value into a variable so that it can be used to join another query.

In this case, the variable you're using to join another query should probably not be exposed to the public facing API.
Otherwise, it's possible for the user to set the variable themselves.

Let's look at an example:

```graphql
query ($code: ID!, $capital: String! @internal) {
  # Get the country with the given code
  country: countries_country(code: $code) {
    code
    name
    capital @export(as: "capital")
    # "join" a new Query to the returned country to fetch the weather
    weather: _join {
      weather_getCityByName(name: $capital) {
        weather {
          temperature {
            actual
          }
        }
      }
    }
  }
}
```

In our case, we're using the `@export` directive to export the capital field into the `$capital` variable.
This variable is then used in the `weather` field of the country.

We've used the `@internal` directive to set it as an internal variable and remove it from the public facing API.
