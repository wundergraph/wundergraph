---
title: '@fromCustomClaim Directive'
pageTitle: WunderGraph - Directives - @fromCustomClaim
description:
---

WunderGraph builds on top of OpenID Connect for authentication.
When a user is authenticated, we're storing all their claims in a cookie.

When defining your GraphQL Operations,
you're able to use the `@fromCustomClaim` directive to access non-standard claims of the user and inject them
into variables.

First, define your custom claims when configuring your WunderGraph application:

```ts
// configureWunderGraph emits the configuration
configureWunderGraphApplication({
  ...
	authentication: {
		customClaims: {
      // Implicit: required
			SHOPID: {
				jsonPath: 'shop.id', // Nested 'id' field inside a 'shop' object
				type: ValueType.INT, // Must be an integer
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

Then use them in your operations to assign values to variables depending on the claim:

```graphql
mutation ($shopID: Int! @fromCustomClaim(name: SHOPID), $productID: Int!) {
  createOneOrder(data: { shop: $shopID, product: $productID }) {
    id
    created
  }
}
```

Notice that variables with injected values are removed from the external JSON RPC API, so callers can't
set them manually. Additional, any operation that uses `@fromCustomClaim` requires the user to be authenticated.

## Type safety and required claims

Custom claim values default to strings, but you can mark them also as int, float or boolean types. If the claim
doesn't match the expected type, the operation will fail due to a validation error.

Custom claims are required by default. If an operation using them does not receive the claim, the operation will
fail due to an invalid input. However, claims can be marked as optional using `required: false`. In this case, an
absent claim will return `null`.

## Injecting well known claims

If you want to inject claims defined by JWT, use `@fromClaim` instead.
