---
title: Configure Token-based Authentication
description: How to configure token-based auhtentication with WunderGraph.
---

Token-Based Authentication is very flexible and gives you a lot of different ways of authenticating client against your WunderGraph applications.
This way, you're able to use WunderGraph with code- or device flows.
The responsibility to obtain an access token in this scenario is on the client itself.

## Usage

Using token based Authentication with WunderGraph follows a simple principle.
Your client obtains a token any way they want.
They then set the token as the Authorization Header.
The header value needs to be prefixed with "Bearer ".

```typescript
`Authorization: Bearer ${TOKEN}`;
```

The WunderGraph Server will then use a JSON Web Key Set from your OpenID Connect Server to validate the token,
in case of a JWT.
If the token is opaque (just a reference),
the JWKS step will be skipped.

Finally, we're using the userInfo Endpoint of the OpenID Connect Server to obtain all available claims from the user,
e.g. their username and email,
which are then stored within the WunderGraph user Identity.

Calling the userInfo Endpoint might be expensive, and it also takes some time.
For that reason, you're able to configure a time to live to allow the WunderGraph server to cache the userInfo response.

## Configuration

Configuring token-based Authentication is straight forward.

### jwksURL

You can set the jwks URL with the `jwksURL` property. If the tokens does not contain any claims (opaque), the WunderGraph server will use the userInfo endpoint to obtain the claims.

```typescript
configureWunderGraphApplication({
  authentication: {
    tokenBased: {
      providers: [
        {
          jwksURL: 'https://wundergraph.fusionauth.io/.well-known/jwks.json',
        },
      ],
    },
  },
});
```

Or with opaque tokens:

```typescript
configureWunderGraphApplication({
  authentication: {
    tokenBased: {
      providers: [
        {
          jwksURL: 'https://wundergraph.fusionauth.io/.well-known/jwks.json',
          userInfoEndpoint: 'https://wundergraph.fusionauth.io/oauth2/userinfo',
        },
      ],
    },
  },
});
```

### jwksJSON

Alternatively, you can also pass the jwks as a JSON String.

```typescript
configureWunderGraphApplication({
  authentication: {
    tokenBased: {
      providers: [
        {
          jwksJSON: '...',
        },
      ],
    },
  },
});
```

### userInfoEndpoint

The user info endpoint is used to obtain the claims of the user. It can be used standalone or in combination with the JWKS URL. The endpoint should return a `200` status code and JSON object with the claims.

```json {% filename="response.json" %}
{
  "id": "1234567890",
  "email": "user@wundergraph.com"
}
```

Any non standard claims will can be accessed in the `customClaims` field of the user object.

```typescript {% filename="wundergraph.config.ts" %}
configureWunderGraphApplication({
  authentication: {
    tokenBased: {
      providers: [
        {
          userInfoEndpoint: 'https://wundergraph.fusionauth.io/oauth2/userinfo',
        },
      ],
    },
  },
});
```

### userInfoCacheTtlSeconds

Finally, you're able to set the TTL to cache the userInfo response.
The default TTL is: 60 \* 60 = 1 hour

```typescript
configureWunderGraphApplication({
  authentication: {
    tokenBased: {
      providers: [
        {
          jwksURL: 'https://wundergraph.fusionauth.io/.well-known/jwks.json',
          userInfoEndpoint: 'https://wundergraph.fusionauth.io/oauth2/userinfo',
          userInfoCacheTtlSeconds: 60 * 60,
        },
      ],
    },
  },
});
```
