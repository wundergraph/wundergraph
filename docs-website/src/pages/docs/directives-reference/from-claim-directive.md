---
title: '@fromClaim Directive'
pageTitle: WunderGraph - Directives - @fromClaim
description:
---

WunderGraph builds on top of OpenID Connect for authentication.
When a user is authenticated,
we're storing all their claims in a cookie.

When defining your GraphQL Operations,
you're able to use the `@fromClaim` directive to access the claims of the user and inject them into variables.

Here's an example:

```graphql
mutation (
  $userId: String! @fromClaim(name: USERID)
  $name: String! @fromClaim(name: NAME)
  $email: String! @fromClaim(name: EMAIL)
  $message: String! @jsonSchema(pattern: "^[a-zA-Z 0-9]+$")
) {
  createOnepost(
    data: {
      message: $message
      user: { connectOrCreate: { where: { email: $email }, create: { email: $email, name: $name, userID: $userID } } }
    }
  ) {
    id
    message
    user {
      id
      name
    }
  }
}
```

We're injecting the `name` and `email` claims into the `$name` and `$email` variables.
The variables are removed from the exported JSON RPC API.
This means, the user cannot set them manually,
JSON Schema validation would prevent this automatically.

Additionally, applying the `@jsonSchema` directive to an operation will automatically enable an authentication check.
So, the user must be authenticated to execute the operation.

## Well known claims

WunderGraph supports the following well known claims:

| Name                  | Claim              | Type    |
| --------------------- | ------------------ | ------- |
| ISSUER                | iss                | string  |
| PROVIDER (deprecated) | iss                | string  |
| SUBJECT               | sub                | string  |
| USERID (alias)        | sub                | string  |
| NAME                  | name               | string  |
| GIVEN_NAME            | given_name         | string  |
| FAMILY_NAME           | family_name        | string  |
| MIDDLE_NAME           | middle_name        | string  |
| NICKNAME              | nickname           | string  |
| PREFERRED_USERNAME    | preferred_username | string  |
| PROFILE               | profile            | string  |
| PICTURE               | picture            | string  |
| WEBSITE               | website            | string  |
| EMAIL                 | email              | string  |
| EMAIL_VERIFIED        | email_verified     | boolean |
| GENDER                | gender             | string  |
| BIRTH_DATE            | birthdate          | string  |
| ZONE_INFO             | zoneinfo           | string  |
| LOCALE                | locale             | string  |
| LOCATION              | location           | string  |

## Custom claims

WunderGraph also supports defining your custom claims and using them in the same as well known ones. First,
define your custom claims when configuring your WunderGraph application:

```ts
// configureWunderGraph emits the configuration
configureWunderGraphApplication({
  ...
	authentication: {
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
});
```

Defining your custom claims allows to generate all the plumbing required to access them in a type-safe manner
and get instant errors in your IDE if you accidentally misuse them.

Then use them in your operations to assign values to variables depending on the claim:

```graphql
mutation ($shopID: Int! @fromClaim(name: SHOPID), $productID: Int!) {
  createOneOrder(data: { shop: $shopID, product: $productID }) {
    id
    created
  }
}
```
