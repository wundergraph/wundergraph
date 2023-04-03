---
title: 'TypeScript Operations'
tags: []
date: 2022-01-02
description: ''
layout: 'wg_by_example'
---

In the previous section, we've used GraphQL to join data across two APIs.
Let's see how we can use TypeScript Operations to achieve the same result and go beyond what's possible with pure
GraphQL.

Let's start by defining two GraphQL Operations first,
so we can fetch a city and weather data.

```graphql
# .wundergraph/operations/weather/Country.graphql
query ($code: String!) @internalOperation {
  countries_countries(filter: { code: { eq: $code } }) {
    code
    name
    capital
  }
}
```

And the second one for fetching the weather data:

```graphql
# .wundergraph/operations/weather/Weather.graphql
query ($city: String!) @internalOperation {
  weather_getCityByName(name: $city) {
    name
    id
    weather {
      summary {
        title
        description
      }
      temperature {
        actual
        feelsLike
        min
        max
      }
    }
  }
}
```

Note that both Operations use the `@internalOperation` directive.
That's because we don't want to expose them to the public API,
but only use them internally.

Last step, we need to define a TypeScript Operation to glue it all together:

```typescript
// .wundergraph/operations/weather/CountryWeather.ts
import { createOperation, z } from '../../generated/wundergraph.factory';

export default createOperation.query({
  input: z.object({
    countryCode: z.string(),
  }),
  handler: async ({ operations, input }) => {
    const country = await operations.query({
      operationName: 'weather/Country',
      input: {
        code: input.countryCode,
      },
    });
    if (!country.data?.countries_countries[0].capital) {
      throw new Error('No capital found');
    }
    const weather = await operations.query({
      operationName: 'weather/Weather',
      input: {
        city: country.data?.countries_countries[0].capital,
      },
    });
    const out: {
      country: string;
      capital: string;
      weather: {
        title: string;
        description: string;
      };
    } = {
      country: country.data?.countries_countries[0].name || '',
      capital: country.data?.countries_countries[0].capital || '',
      weather: {
        title: weather.data?.weather_getCityByName?.weather?.summary?.title || '',
        description: weather.data?.weather_getCityByName?.weather?.summary?.description || '',
      },
    };
    return out;
  },
});
```

TypeScript Operations follow more or less the same structure as GraphQL Operations,
the flow is just a bit different.
We don't derive a JSON Schema from the GraphQL Variables,
but instead use the `zod` library to define the input schema.

We're then free to put whatever code we want into the `handler` function.
In this case, we're using the `operations` object passed to the handler to execute the two GraphQL Operations we've
defined before.

Let's call our operation:

```shell
curl -X GET http://localhost:9991/operations/weather/CountryWeather?countryCode=DE
```

And we get the following response, it's freezingly cold in Berlin right now:

```json
{
  "data": {
    "country": "Germany",
    "capital": "Berlin",
    "weather": {
      "title": "Snow",
      "description": "light snow"
    }
  }
}
```
