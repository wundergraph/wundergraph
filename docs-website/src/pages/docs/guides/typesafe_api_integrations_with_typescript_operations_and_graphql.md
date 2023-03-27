---
title: TypeSafe API Integrations with TypeScript Operations & GraphQL
pageTitle: WunderGraph - Guides - TypeSafe API Integrations with TypeScript Operations & GraphQL
description: Learn how to type-safe integrate data from multiple APIs using WunderGraph's TypeScript Operations feature & GraphQL
---

If you're looking for a solution to combine data from multiple APIs,
you might have already stumbled upon our JOIN feature.
This feature allows you to combine data from multiple APIs in a single query,
just using GraphQL.

However, sometimes it takes a bit more than just doing a JOIN.
You might also want to add some custom business logic,
e.g. to transform the data.

In this guide, we'll show you how to do this with TypeScript Operations.

## Setup

Let's add two APIs to the `wundergraph.config.ts`, weather and countries, so we've got something to work with.

```typescript
// wundergraph.config.ts
const countries = introspect.graphql({
  apiNamespace: 'countries',
  url: 'https://countries.trevorblades.com/',
});

const weather = introspect.graphql({
  apiNamespace: 'weather',
  url: 'https://weather-api.wundergraph.com/',
});

// configureWunderGraph emits the configuration
configureWunderGraphApplication({
  apis: [spaceX, countries, weather],
});
```

We put each API into its own namespace,
this way there will be no collisions.

## Defining two GraphQL Operations

Next, we'll define one GraphQL Operation for each API to be able to combine them later.

Let's start with the Country Operation:

```graphql
# operations/Country.graphql
query ($code: ID!) {
  countries_country(code: $code) {
    code
    name
    capital
  }
}
```

This operation will fetch the weather for a given city.
Second, we'll define the Weather Operation:

```graphql
# operations/Weather.graphql
query ($city: String!) {
  weather_getCityByName(name: $city, config: { units: metric }) {
    weather {
      summary {
        title
        description
        icon
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

This operation will fetch the weather for a given city.

## Combining two GraphQL Operations using a TypeScript Operation

Now, we'll combine the two GraphQL Operations using a TypeScript Operations.

```typescript
// operations/combined/weather.ts
export default createOperation.query({
  input: z.object({
    // we define the input of the operation
    code: z.string(),
  }),
  handler: async (ctx) => {
    // using ctx.internalClient, we can call the previously defined GraphQL Operations
    // both input and response of the GraphQL Operations are fully typed
    const country = await ctx.internalClient.queries.Country({
      input: {
        code: ctx.input.code,
      },
    });
    const weather = await ctx.internalClient.queries.Weather({
      input: {
        city: country.data?.countries_country?.capital || '',
      },
    });
    return {
      // finally, we return the combined data
      // as you can see, we can easily map the data as it's type-safe
      country: country.data?.countries_country,
      weather: weather.data?.weather_getCityByName?.weather,
    };
  },
});
```

## Using the combined GraphQL Operation from the client

In the final step, we'll use the combined GraphQL Operation from our NextJS frontend.

```typescript jsx
// pages/index.tsx
import { useState } from 'react';
import { useQuery } from '../components/generated/nextjs';

const Weather = () => {
  const [countryCode, setCountryCode] = useState('DE');
  const { data } = useQuery({
    operationName: 'combine/weather',
    input: {
      code: countryCode, // type-safe input inferred from the input definition of the TypeScript Operation
    },
  });
  return (
    <div>
      <br />
      <input value={countryCode} onChange={(e) => setCountryCode(e.target.value)}></input>
      <br />
      <br /> // type-safe data access inferred from the response definition of the TypeScript Operation
      <pre style={{ color: 'white' }}>{JSON.stringify(data?.country)}</pre>
      <pre style={{ color: 'white' }}>{JSON.stringify(data?.weather)}</pre>
    </div>
  );
};

export default Weather;
```

## Type-safe Error Handling

In TypeScript Operations you can create custom errors which will be available to the client in the `code` field of the error. This allows you to have typed errors on the client side, which can be used to handle errors in a more granular way.
Custom errors are defined by extending the `OperationError` class and passed to the `errors` field of the handler definition. The `statusCode` field is optional and defines the final response status code (defaults to `500`).

```typescript
// .wundergraph/operations/math/divide.ts
import { OperationError } from '@wundergraph/sdk/operations';
import { createOperation, z } from '../generated/wundergraph.factory';

export class DividedByZero extends OperationError {
  statusCode = 400;
  code = 'DividedByZero' as const;
  message = 'Cannot divide by zero';
}

export default createOperation.query({
  errors: [DividedByZero], // Your custom errors, used for code generation
  input: z.object({
    a: z.number(),
    b: z.number(),
  }),
  handler: async ({ input }) => {
    if (input.b === 0) {
      throw new DividedByZero();
    }
    return {
      add: input.a / input.b,
    };
  },
});
```

Now, when we call this operation with `b` being `0`, we'll get the following error:

```typescript
import { ReponseError } from '@wundergraph/sdk/client';
const { data, error } = await client.query({
  operationName: 'users/get',
});

// type-safe error handling
if (error?.code === 'DividedByZero') {
  // handle error
  error.statusCode; // 400
  error.message; // Cannot divide by zero
}
```

## Conclusion

That's it! We've successfully combined data from two APIs and handled error cases fully type-safe.

## Bonus points: Access the user through the context

As a bonus, I just wanted to show you that you can also access the user through the context.

WunderGraph supports various authentication methods out of the box,
the most common one is OpenID Connect (OIDC).
Let's assume that we're using an OIDC provider that returns the user's city in the `location` claim.

We can leverage this to create an Operation that returns the weather for the user's city.

```typescript
// operations/user/weather.ts
export default createOperation.query({
  requireAuthentication: true, // this operation requires authentication
  handler: async (ctx) => {
    const weather = await ctx.internalClient.queries.Weather({
      input: {
        city: ctx.user.location || '',
      },
    });
    return {
      weather: weather.data?.weather_getCityByName?.weather,
    };
  },
});
```

We've also set `requireAuthentication: true` to make sure that the user is authenticated.
With that, we've implemented a simple way to present the user with the weather for their city.

That's it for now! I hope you enjoyed this guide and learned something new.
