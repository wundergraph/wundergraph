---
title: Using claims
description: Declare and manipulate user attributes.
---

WunderGraph supports claims, which allow you to declare and manipulate user attributes.

## Well Known claims

Out of the box, WunderGraph understands several well known claims directly. The full list can be found in the
documentation for the `@fromClaim` directive.

## Custom claims

WunderGraph also supports defining your custom claims and using them in the same as well known ones. First,
define your custom claims when configuring your WunderGraph application:

```typescript
configureWunderGraphApplication({
  ...
	authentication: {
        ...
		customClaims: {
			// Implicit: required
			SHOPID: {
				jsonPath: 'shop.id', // Nested 'id' field inside a 'shop' object
				type: 'int', // Must be an integer
			},
			// Implicit: string
			TENANTID: {
				jsonPath: 'teid',
				required: false, // Optional
			},
	    },
    },
});
```

Defining your custom claims allows to generate all the plumbing required to access them in a type-safe manner
and get instant errors in your IDE if you accidentally misuse them.

## Using claims

Claims can be injected into any variable during a GraphQL operation using the `@fromClaim` directive. In Typescript
operations or client code, claims are available as part of the `User` object. Well known claims are mapped to fields,
while custom claims live below the `customClaims` field in `User`.

## Exposing claims from your API

By default, all well known and custom claims are exposed from the API, and the frontend can access them
wherever a `User` object is available (e.g. using `Client.fetchUser()` or `useUser()`). To expose only a subset of them, define a list of `publicClaims` when calling `configureWunderGraphApplication()`:

```ts
// configureWunderGraph emits the configuration
configureWunderGraphApplication({
  ...
	authentication: {
        ...
        publicClaims: [
            'USERID',  // Well known
            'TENANTID', // Custom, same syntax as well known
        ],
	},
});
```

Claim names are strongly typed, so your editor will autocomplete them in most cases.
