---
title: '@fromClaim Directive'
description: Inject claims into variables
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

| Name                  | Claim              | Type    | `User` field      |
| --------------------- | ------------------ | ------- | ----------------- |
| ISSUER                | iss                | string  | providerId        |
| PROVIDER (deprecated) | iss                | string  | providerId        |
| SUBJECT               | sub                | string  | userId            |
| USERID (alias)        | sub                | string  | userId            |
| NAME                  | name               | string  | name              |
| GIVEN_NAME            | given_name         | string  | firstName         |
| FAMILY_NAME           | family_name        | string  | lastName          |
| MIDDLE_NAME           | middle_name        | string  | middleName        |
| NICKNAME              | nickname           | string  | nickName          |
| PREFERRED_USERNAME    | preferred_username | string  | preferredUsername |
| PROFILE               | profile            | string  | profile           |
| PICTURE               | picture            | string  | picture           |
| WEBSITE               | website            | string  | website           |
| EMAIL                 | email              | string  | email             |
| EMAIL_VERIFIED        | email_verified     | boolean | emailVerified     |
| GENDER                | gender             | string  | gender            |
| BIRTH_DATE            | birthdate          | string  | birthDate         |
| ZONE_INFO             | zoneinfo           | string  | zoneInfo          |
| LOCALE                | locale             | string  | locale            |
| LOCATION              | location           | string  | location          |

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

Additionaly, custom claims are also available in `User` instances in both hooks and functions, under
`User.customClaims.<claimID>` (e.g. `User.customClaims.shopID`).

## Injecting claims into fields

`@fromClaim` accepts a second optional `on:` argument that might be used to inject a value into an
specific field. Given the following type:

```graphql
input countries_CountryFilterInput {
  code: String!
}
```

We can use `@fromClaim` to set the value of `code` using:

```graphql
mutation ($filter: countries_CountryFilterInput! @fromClaim(name: COUNTRY_CODE, on: "code")) {
  countries_Countries(filter: $filter) {
    id
    name
  }
}
```

## Injecting multiple values

`@fromClaim` can be used multiple times on the same operation, injecting data into different fields.
Additionally, `@fromClaim` can be combined with other directives for injecting or manipulating data
like `@injectCurrentDateTime`, `@injectEnvironmentVariable`, `@injectGeneratedUUID` and `@jsonSchema`.
